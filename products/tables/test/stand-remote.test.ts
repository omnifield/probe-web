// Сеть площадки: хранилище по HTTP и запрос к агенту.
//
// Проверяется поведение на ЧУЖОЙ стороне провода, потому что именно оно выстрелит на показе:
// сервиса нет · сервис отказал по делу · сервис ответил мусором · агент не поднят.
// Настоящий `fetch` подменяется — сеть в пробах не нужна и не должна быть нужна.

import { afterEach, describe, expect, it, vi } from "vitest";

import { askAgent } from "../src/playground/agent.js";
import {
  createHttpPresetStore,
  createStandStore,
  PresetRefused,
} from "../src/playground/remote-store.js";

const real = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = real;
  vi.restoreAllMocks();
});

/** Подменяет `fetch` заданным ответом или отказом связи. */
function answers(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const spy = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init)),
  );
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("хранилище по HTTP", () => {
  it("перечень переводится с провода: `description` там — `hint` здесь", async () => {
    answers(() => json({ items: [{ id: "1", label: "Крупные", description: "дороже 500к", savedAt: "2026-08-13T10:00:00.000Z" }] }));

    const [item] = await createHttpPresetStore().list();

    expect(item).toEqual({
      id: "1",
      label: "Крупные",
      hint: "дороже 500к",
      savedAt: "2026-08-13T10:00:00.000Z",
    });
  });

  it("сохранение шлёт `description`, а не наше внутреннее имя поля", async () => {
    const spy = answers(() => json({ id: "7", label: "Крупные", savedAt: "2026-08-13T10:00:00.000Z" }));

    await createHttpPresetStore().save({ label: "Крупные", hint: "дороже 500к", state: { a: 1 } });

    const sent = JSON.parse(String(spy.mock.calls[0]![1]!.body)) as Record<string, unknown>;
    expect(sent["description"]).toBe("дороже 500к");
    expect(sent["hint"]).toBeUndefined();
  });

  it("ответ без полей не роняет список: пустое имя лучше, чем `undefined` на экране", async () => {
    answers(() => json({ items: [{}] }));

    const [item] = await createHttpPresetStore().list();

    expect(item).toEqual({ id: "", label: "", savedAt: "" });
  });

  it("нет такого пресета — `null`, а не исключение", async () => {
    answers(() => new Response("", { status: 404 }));
    expect(await createHttpPresetStore().load("нет")).toBeNull();
  });

  it("отказ сервиса (4xx) отличается от поломки связи и несёт свой текст", async () => {
    answers(() => new Response("Сохранено уже 200 отборов — предел 200.", { status: 409 }));

    await expect(createHttpPresetStore().save({ label: "ещё один", state: null })).rejects.toThrow(
      PresetRefused,
    );
  });
});

describe("площадка живёт без сервиса", () => {
  it("мёртвый сервис переводит хранилище в память и НАЗЫВАЕТ причину", async () => {
    answers(() => {
      throw new TypeError("Failed to fetch");
    });

    const stand = createStandStore();
    expect(await stand.store.list()).toEqual([]);

    expect(stand.mode()).toBe("local");
    expect(stand.reason()).toMatch(/Failed to fetch/);
  });

  it("в памяти сохранение и применение продолжают работать", async () => {
    answers(() => new Response("", { status: 503 }));

    const stand = createStandStore();
    const info = await stand.store.save({ label: "Крупные", state: { version: 1 } });

    expect(stand.mode()).toBe("local");
    expect((await stand.store.list()).map((one) => one.label)).toEqual(["Крупные"]);
    expect((await stand.store.load(info.id))?.state).toEqual({ version: 1 });
  });

  it("ОТКАЗ ПО ДЕЛУ в память не роняет: сервис ответил, и его слышно", async () => {
    answers(() => new Response("Имя обязательно.", { status: 400 }));

    const stand = createStandStore();
    await expect(stand.store.save({ label: "", state: null })).rejects.toThrow(/Имя обязательно/);

    // Режим прежний: сервис жив, он просто не взял именно эту запись.
    expect(stand.mode()).toBe("service");
  });

  it("съехав в память, туда и ходим — мёртвый сервис не дёргаем на каждое нажатие", async () => {
    const spy = answers(() => {
      throw new TypeError("Failed to fetch");
    });

    const stand = createStandStore();
    await stand.store.list();
    await stand.store.list();
    await stand.store.save({ label: "Крупные", state: null });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("запрос к агенту", () => {
  it("состояние приходит как ЧУЖОЙ ввод и отдаётся как есть — разбирает вызывающий", async () => {
    answers(() => json({ state: { version: 1, conditions: [] } }));

    const answer = await askAgent("крупные заявки");

    expect(answer).toEqual({ ok: true, state: { version: 1, conditions: [] } });
  });

  it("сервиса ПОКА НЕТ (404) — внятная причина, а не исключение", async () => {
    answers(() => new Response("", { status: 404 }));

    const answer = await askAgent("крупные заявки");

    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.error).toMatch(/пока недоступен/);
  });

  it("связи нет — тоже ответ, а не повисшая кнопка", async () => {
    answers(() => {
      throw new TypeError("Failed to fetch");
    });

    const answer = await askAgent("крупные заявки");

    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.error).toMatch(/собрать руками/);
  });

  it("агент сказал «не понял» — показываем ЕГО текст", async () => {
    answers(() => json({ error: "не понял, про какое поле речь" }));

    const answer = await askAgent("что-нибудь");

    expect(answer).toEqual({ ok: false, error: "не понял, про какое поле речь" });
  });

  it("ответ без отбора — отказ, а не пустой фильтр поверх данных", async () => {
    answers(() => json({}));

    const answer = await askAgent("крупные заявки");

    expect(answer.ok).toBe(false);
  });

  it("пустой запрос до сети не доезжает", async () => {
    const spy = answers(() => json({ state: {} }));

    const answer = await askAgent("   ");

    expect(answer.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("агент молчит дольше предела — «не дождались», а не бесконечное ожидание", async () => {
    globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      })) as unknown as typeof fetch;

    const answer = await askAgent("крупные заявки", "/api/agent/preset", 5);

    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.error).toMatch(/не ответил вовремя/);
  });
});
