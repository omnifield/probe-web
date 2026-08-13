// Хранилище пресетов: контракт на реализации в памяти, ограничители и правило шва.
//
// Главное здесь не «кладётся и достаётся», а два свойства, которые ломаются молча:
//   • из хранилища приходит ЧУЖОЙ ВВОД — читатель обязан прогнать его через `parseFilter`;
//   • в поставляемой части зоны нет ни одного `fetch` (`kb:PROBEWEB-8`).

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  checkPresetInput,
  createMemoryPresetStore,
  EMPTY_FILTER,
  type FilterState,
  parseFilter,
  PRESET_LIMITS,
  serializeFilter,
} from "../src/filters/index.js";

const STATE: FilterState = {
  ...EMPTY_FILTER,
  conditions: [{ id: "c-1", kind: "compare", field: "/amount", operator: "gt", value: "100" }],
};

const at = () => new Date("2026-08-13T10:00:00.000Z");

describe("контракт хранилища на реализации в памяти", () => {
  it("сохраняет и отдаёт обратно, идентификатор выдаёт хранилище", async () => {
    const store = createMemoryPresetStore([], at);

    const info = await store.save({ label: "Крупные", state: serializeFilter(STATE) });

    expect(info.id).not.toBe("");
    expect(info.label).toBe("Крупные");
    expect(info.savedAt).toBe("2026-08-13T10:00:00.000Z");

    const loaded = await store.load(info.id);
    expect(loaded?.state).toEqual(serializeFilter(STATE));
  });

  it("перечень идёт БЕЗ содержимого — списку оно не нужно", async () => {
    const store = createMemoryPresetStore([], at);
    await store.save({ label: "Крупные", state: serializeFilter(STATE) });

    const [item] = await store.list();

    expect(item).toBeDefined();
    expect("state" in item!).toBe(false);
  });

  it("имя чистится от пробелов, пустое пояснение не сохраняется полем", async () => {
    const store = createMemoryPresetStore([], at);

    const info = await store.save({ label: "  Срочные  ", hint: "   ", state: null });

    expect(info.label).toBe("Срочные");
    expect(info.hint).toBeUndefined();
  });

  it("удаление несуществующего — не ошибка: результат тот же", async () => {
    const store = createMemoryPresetStore([], at);
    await expect(store.remove("нет-такого")).resolves.toBeUndefined();
    expect(await store.load("нет-такого")).toBeNull();
  });

  it("удаление убирает из перечня", async () => {
    const store = createMemoryPresetStore([], at);
    const info = await store.save({ label: "Крупные", state: null });

    await store.remove(info.id);

    expect(await store.list()).toEqual([]);
  });
});

describe("ограничители — в первой версии, а не «потом»", () => {
  it("без имени не сохраняем: список без названий бесполезен", async () => {
    const store = createMemoryPresetStore([], at);
    await expect(store.save({ label: "   ", state: null })).rejects.toThrow(/Имя обязательно/);
  });

  it("слишком длинное имя и слишком большой отбор отбиваются с внятной причиной", () => {
    expect(checkPresetInput({ label: "я".repeat(PRESET_LIMITS.label + 1), state: null }, 0)).toMatch(
      /Имя длиннее/,
    );
    expect(checkPresetInput({ label: "ок", state: "я".repeat(PRESET_LIMITS.state) }, 0)).toMatch(
      /больше предела/,
    );
  });

  it("предел числа записей называет, сколько уже сохранено", () => {
    expect(checkPresetInput({ label: "ок", state: null }, PRESET_LIMITS.count)).toMatch(
      new RegExp(`${PRESET_LIMITS.count}`),
    );
  });

  it("отказ приезжает отклонённым промисом с человеческим текстом, а не кодом", async () => {
    const store = createMemoryPresetStore([], at);
    await expect(store.save({ label: "", state: null })).rejects.toThrow(
      /из списка выбирают по названию/,
    );
  });
});

describe("бэк ХРАНИТ, зона ПОНИМАЕТ", () => {
  it("хранилище отдаёт что положили — включая мусор, и это ловит `parseFilter`", async () => {
    // Хранилище формата не знает: ему положили строку — он вернёт строку.
    const store = createMemoryPresetStore([], at);
    const info = await store.save({ label: "Мусор", state: { version: 1, conditions: "нет" } });

    const loaded = await store.load(info.id);
    const parsed = parseFilter(loaded!.state);

    expect(parsed.ok).toBe(false);
  });

  it("чужая версия формата отбивается на читателе, а не в хранилище", async () => {
    const store = createMemoryPresetStore([], at);
    const info = await store.save({
      label: "Из будущего",
      state: { ...serializeFilter(STATE), version: 999 },
    });

    const parsed = parseFilter((await store.load(info.id))!.state);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/верси/i);
  });

  it("своё же сохранённое читается обратно без потерь", async () => {
    const store = createMemoryPresetStore([], at);
    const info = await store.save({ label: "Крупные", state: serializeFilter(STATE) });

    const parsed = parseFilter((await store.load(info.id))!.state);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.state.conditions).toEqual(STATE.conditions);
  });
});

describe("правило шва: зона не ходит в сеть", () => {
  /** Поставляемая часть — весь `src`, КРОМЕ площадки: она в поставку не едет. */
  function shipped(dir: string, found: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const path = `${dir}/${entry}`;
      if (entry === "playground") continue;
      if (statSync(path).isDirectory()) shipped(path, found);
      else if (/\.tsx?$/.test(entry)) found.push(path);
    }
    return found;
  }

  it("в поставляемой части нет ни `fetch`, ни другого выхода наружу", () => {
    // От корня прогона, а не от `import.meta.url`: сборщик переписывает `new URL(…)` как
    // ссылку на ресурс, и до диска дело не доходит.
    const root = join(process.cwd(), "src");
    expect(existsSync(root), "пробу запускают из папки зоны").toBe(true);
    const guilty: string[] = [];

    for (const file of shipped(root)) {
      const code = readFileSync(file, "utf8").replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
      if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(code)) {
        guilty.push(file.slice(root.length + 1));
      }
    }

    // Библиотека, которая ходит в сеть по зашитому адресу, перестаёт собираться у потребителя
    // без этого адреса — и роняет стенд, когда сервиса нет.
    expect(guilty).toEqual([]);
  });
});
