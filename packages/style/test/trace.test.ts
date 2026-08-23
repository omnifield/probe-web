import { afterEach, describe, expect, it, vi } from "vitest";

// Лист графа замеров: `buildScale` не зовёт внутри себя ничего трассируемого, поэтому «ровно
// один вызов» — свойство самого трейса, а не совпадение. `themeModelToCss` здесь не годится:
// он строит обе половины и даёт пятнадцать замеров подряд.
import { buildScale } from "../src/scale.js";
import { SEEDS } from "./helpers/seeds.js";
import { trace } from "../src/trace.js";

const FLAG = "__PROBE_WEB_STYLE_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

afterEach(() => {
  delete (globalThis as TraceGlobal)[FLAG];
  vi.restoreAllMocks();
});

describe("trace", () => {
  it("по умолчанию молчит — трейс не включается сам", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    trace("замер")();
    buildScale(SEEDS.brand, "light");

    expect(debug).not.toHaveBeenCalled();
  });

  it("глобальный флаг включает замер с именем участка и длительностью", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    (globalThis as TraceGlobal)[FLAG] = true;

    buildScale(SEEDS.brand, "light");

    expect(debug).toHaveBeenCalledTimes(1);
    expect(debug.mock.calls[0][0]).toMatch(
      /^\[probe-web-style] buildScale\(light\) — \d+\.\d{2}ms$/,
    );
  });
});
