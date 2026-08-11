import { afterEach, describe, expect, it, vi } from "vitest";

import { registerTheme } from "../src/theme.js";
import { DEFAULT_LIGHT } from "../src/tokens.js";
import { trace } from "../src/trace.js";

const FLAG = "__PROBE_WEB_STYLE_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

afterEach(() => {
  delete (globalThis as TraceGlobal)[FLAG];
  document.head.innerHTML = "";
  vi.restoreAllMocks();
});

describe("trace", () => {
  it("по умолчанию молчит — трейс не включается сам", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    trace("замер")();
    registerTheme({ name: "ocean", light: DEFAULT_LIGHT });

    expect(debug).not.toHaveBeenCalled();
  });

  it("глобальный флаг включает замер с именем участка и длительностью", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    (globalThis as TraceGlobal)[FLAG] = true;

    registerTheme({ name: "ocean", light: DEFAULT_LIGHT });

    expect(debug).toHaveBeenCalledTimes(1);
    expect(debug.mock.calls[0][0]).toMatch(
      /^\[probe-web-style] registerTheme\(ocean\) — \d+\.\d{2}ms$/,
    );
  });
});
