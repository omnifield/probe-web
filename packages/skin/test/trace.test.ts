// ТРАССА — замеры, которые включает потребитель.
//
// Проверяется не «печатается ли строка», а два свойства, ради которых трасса написана так:
// выключенная НЕ трогает часы (иначе замер на каждое правило сам стал бы тем, что он измеряет) и
// включается только явным флагом, а не режимом сборки.

import { afterEach, describe, expect, it, vi } from "vitest";

import { flattenCss } from "../src/flatten.js";
import { generateSkinCss } from "../src/generate.js";
import { note, trace } from "../src/trace.js";
import { lookup } from "./passports.js";
import { buttonSkin, VOCABULARY } from "./skins.js";

const FLAG = "__PROBE_WEB_SKIN_TRACE__";

type Flagged = typeof globalThis & { [FLAG]?: boolean };

afterEach(() => {
  delete (globalThis as Flagged)[FLAG];
  vi.restoreAllMocks();
});

describe("по умолчанию молчит", () => {
  it("замер не печатает ничего", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    trace("что-то")();
    note("и это тоже");

    expect(debug).not.toHaveBeenCalled();
  });

  it("выключенная трасса не трогает часы", () => {
    const now = vi.spyOn(performance, "now");

    trace("что-то")();

    expect(now).not.toHaveBeenCalled();
  });

  it("целое порождение проходит молча", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    generateSkinCss(buttonSkin, lookup, { tokens: VOCABULARY });

    expect(debug).not.toHaveBeenCalled();
  });
});

describe("включается флагом", () => {
  it("замер печатает имя участка и длительность", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    (globalThis as Flagged)[FLAG] = true;

    trace("сборка")();

    expect(debug).toHaveBeenCalledTimes(1);
    expect(debug.mock.calls[0]![0]).toMatch(/^\[probe-web-skin] сборка — \d+\.\d\dms$/);
  });

  it("порождение отчитывается по шагам, и чужой шаг назван отдельно", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    (globalThis as Flagged)[FLAG] = true;

    generateSkinCss(buttonSkin, lookup, { tokens: VOCABULARY });

    const lines = debug.mock.calls.map((call) => String(call[0]));

    expect(lines.some((line) => line.includes("skinRules"))).toBe(true);
    expect(lines.some((line) => line.includes("generateSkinCss"))).toBe(true);
    // Разворота в порождении больше НЕТ: вложенная форма уходит браузеру как есть.
    expect(lines.some((line) => line.includes("flattenCss"))).toBe(false);
  });

  it("разворот отчитывается отдельно — это чужая работа и чужой вес", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    (globalThis as Flagged)[FLAG] = true;

    flattenCss(generateSkinCss(buttonSkin, lookup, { tokens: VOCABULARY }));

    expect(debug.mock.calls.map((call) => String(call[0])).some((l) => l.includes("flattenCss"))).toBe(
      true,
    );
  });

  it("событие без длительности печатается строкой", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    (globalThis as Flagged)[FLAG] = true;

    note("изъян");

    expect(debug).toHaveBeenCalledWith("[probe-web-skin] изъян");
  });
});
