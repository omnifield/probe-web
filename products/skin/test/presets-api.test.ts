// ПРОБА СЛУЖБЫ ПРЕСЕТОВ: что уезжает на провод, что читается обратно и что происходит, когда
// службы нет.
//
// Транспорт ПОДМЕНЯЕТСЯ — в сеть не ходим. Проверять сохранение настоящим запросом значит
// проверять сеть вместо своего кода и получать красный прогон там, где служба просто не поднята.
//
// Три вещи, каждая из которых ломается молча:
//
//   1. РАЗНИЦА между «служба отказала» и «службы нет». Спутать их — показать человеку
//      «сохранено», когда служба как раз отказалась: он уйдёт, считая пресет общим.
//   2. ЯРЛЫК ВИДА уезжает и в запись, и в запрос списка. Без него список смешается с отборами
//      зоны таблиц, и человек увидит чужие записи как свои.
//   3. ЧУЖАЯ ЗАПИСЬ не ломает чтение. Хранилище общее и непрозрачное для службы: под ярлыком
//      может лежать что угодно, и читатель обязан взять только то, что понимает.

import { describe, expect, it } from "vitest";

import { TWITTER } from "../src/presets/built-in.js";
import { createPresetsApi, PresetRefused, ServiceDown } from "../src/playground/presets-api.js";

const BASE = "http://служба/api/presets";

/** Ответ службы. Только то, чем пользуется клиент. */
function reply(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body ?? "")),
  } as Response;
}

/** Записанные вызовы транспорта — то, что реально уехало бы в сеть. */
function recorder(answer: (url: string, init?: RequestInit) => Response) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const send = ((url: string | URL | Request, init?: RequestInit) => {
    const text = typeof url === "string" ? url : String(url);
    calls.push(init === undefined ? { url: text } : { url: text, init });
    return Promise.resolve(answer(text, init));
  }) as unknown as typeof fetch;

  return { calls, send };
}

const OUR_STATE = {
  id: "nash-vid",
  seeds: TWITTER.seeds,
  meta: TWITTER.meta,
  darkOverrides: TWITTER.darkOverrides,
  density: TWITTER.density,
};

describe("запись в службу", () => {
  it("уезжает МОДЕЛЬ, ярлык вида и имя от человека", () => {
    const { calls, send } = recorder(() =>
      reply(201, { id: "srv-1", label: "Пульт продаж", savedAt: "2026-08-17T10:00:00Z" }),
    );
    const api = createPresetsApi(BASE, send);

    return api.save({ ...TWITTER, title: "Пульт продаж" }, "для дежурного экрана").then(() => {
      const body = JSON.parse(String(calls[0]?.init?.body)) as Record<string, unknown>;

      expect(calls[0]?.init?.method).toBe("POST");
      expect(body["label"]).toBe("Пульт продаж");
      expect(body["description"]).toBe("для дежурного экрана");
      expect(body["kind"], "без ярлыка список смешается с отборами таблиц").toBe("skin");

      // Уезжает модель, а не готовый CSS: из модели он всегда соберётся, обратно — нет.
      const state = body["state"] as Record<string, unknown>;
      expect(state["seeds"]).toEqual(TWITTER.seeds);
      expect(state["density"]).toBe(TWITTER.density);
      expect(JSON.stringify(state), "в службу уехал CSS вместо модели").not.toContain("oklch(0.4");
    });
  });

  it("идентификатора ДВА, и они не путаются", async () => {
    // Служба опознаёт ЗАПИСЬ (её UUID — по нему удаляют), а в `data-theme` уезжает имя ТЕМЫ, и
    // оно обязано остаться читаемым: `data-theme="5fdbea2d-4afc-…"` человеку не говорит ничего.
    const { calls, send } = recorder(() => reply(201, { id: "srv-42", label: "Пульт" }));
    const saved = await createPresetsApi(BASE, send).save({ ...TWITTER, title: "Пульт" });

    expect(saved.recordId, "идентификатор записи — от службы").toBe("srv-42");
    expect(saved.id, "имя темы — наше").toBe(TWITTER.id);
    expect(saved.origin).toBe("свой");

    const state = (JSON.parse(String(calls[0]?.init?.body)) as { state: { id: string } }).state;
    expect(state.id, "имя темы обязано уехать в состояние, иначе его негде взять").toBe(TWITTER.id);
  });

  it("пустое пояснение не отправляется вовсе", async () => {
    const { calls, send } = recorder(() => reply(201, { id: "srv-2", label: "П" }));
    await createPresetsApi(BASE, send).save({ ...TWITTER, title: "П" }, "   ");

    expect(Object.keys(JSON.parse(String(calls[0]?.init?.body)) as object)).not.toContain(
      "description",
    );
  });
});

describe("чтение списка", () => {
  it("спрашивает по ярлыку вида", async () => {
    const { calls, send } = recorder(() => reply(200, { items: [] }));
    await createPresetsApi(BASE, send).list();

    expect(calls[0]?.url).toBe(`${BASE}?kind=skin`);
  });

  it("чужая запись отбрасывается, наша читается", async () => {
    const { send } = recorder((raw) => {
      // Адрес записи закодирован (`encodeURIComponent`), поэтому сравниваем расшифрованный.
      const url = decodeURIComponent(raw);
      if (url.endsWith("?kind=skin")) {
        return reply(200, { items: [{ id: "чужой" }, { id: "наш" }] });
      }
      if (url.endsWith("/чужой")) {
        // Отбор зоны таблиц: та же служба, другой вид данных.
        return reply(200, { id: "чужой", label: "Отбор", state: { conditions: [] } });
      }
      return reply(200, { id: "наш", label: "Наш вид", state: OUR_STATE });
    });

    const items = await createPresetsApi(BASE, send).list();

    expect(items.map((p) => p.recordId), "чужая запись прочитана как своя").toEqual(["наш"]);
    expect(items[0]?.id, "имя темы читается из состояния, а не из идентификатора записи").toBe(
      "nash-vid",
    );
    expect(items[0]?.title).toBe("Наш вид");
    expect(items[0]?.seeds).toEqual(TWITTER.seeds);
  });

  it("ответ без списка не роняет стенд", async () => {
    const { send } = recorder(() => reply(200, {}));
    await expect(createPresetsApi(BASE, send).list()).resolves.toEqual([]);
  });
});

describe("служба отказала и службы нет — это РАЗНЫЕ вещи", () => {
  it("четырёхсотка — отказ по делу, с текстом службы", async () => {
    const { send } = recorder(() => reply(413, "Запись больше 64 КиБ."));

    await expect(createPresetsApi(BASE, send).save(TWITTER)).rejects.toThrow(PresetRefused);
    await expect(createPresetsApi(BASE, send).save(TWITTER)).rejects.toThrow("64 КиБ");
  });

  it("пятисотка — службы нет", async () => {
    const { send } = recorder(() => reply(502));
    await expect(createPresetsApi(BASE, send).list()).rejects.toThrow(ServiceDown);
  });

  it("обрыв связи — тоже «службы нет», а не отказ", async () => {
    // Иначе стенд у человека без сети говорил бы «служба не приняла пресет», и тот искал бы
    // ошибку в пресете.
    const send = (() => Promise.reject(new Error("ECONNREFUSED"))) as unknown as typeof fetch;
    await expect(createPresetsApi(BASE, send).list()).rejects.toThrow(ServiceDown);
  });

  it("удаление идёт по адресу записи и методом DELETE", async () => {
    const { calls, send } = recorder(() => reply(204));
    await createPresetsApi(BASE, send).remove("srv 1/2");

    expect(calls[0]?.url).toBe(`${BASE}/srv%201%2F2`);
    expect(calls[0]?.init?.method).toBe("DELETE");
  });
});

describe("поставка про службу не знает", () => {
  it("ни одного обращения к сети в поставляемой части зоны", async () => {
    // Инвариант 8 (`kb:SKIN-7`): результат достижим как чистый CSS. Зона, которую берут ради
    // вида, обязана работать там, где никакой службы нет, — поэтому сеть живёт в площадке.
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { ZONE } = await import("./css.js");

    const dirs = [join(ZONE, "src", "skin"), join(ZONE, "src", "presets"), join(ZONE, "src", "icons")];
    const guilty: string[] = [];

    for (const dir of dirs) {
      for (const name of readdirSync(dir)) {
        if (!name.endsWith(".ts") && !name.endsWith(".css")) continue;
        const text = readFileSync(join(dir, name), "utf8");
        if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage/.test(text)) guilty.push(name);
      }
    }

    expect(guilty, "поставка обратилась к сети или к хранилищу браузера").toEqual([]);
  });
});
