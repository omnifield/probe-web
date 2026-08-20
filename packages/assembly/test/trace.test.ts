// Трасса: по умолчанию молчит, по флагу говорит.
//
// Проверяется не «красиво ли пишет», а два свойства, из-за которых трассу вообще заводят:
// выключенная не стоит ничего и не шумит в чужой консоли, включённая — называет участок.

import { afterEach, describe, expect, it, vi } from "vitest";

import { note, trace } from "../src/trace.js";

const FLAG = "__PROBE_WEB_ASSEMBLY_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

afterEach(() => {
  delete (globalThis as TraceGlobal)[FLAG];
  vi.restoreAllMocks();
});

describe("трасса", () => {
  it("выключена по умолчанию — ни строки", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    trace("замер")();
    note("событие");

    expect(debug).not.toHaveBeenCalled();
  });

  it("включается глобальным флагом и называет участок", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    (globalThis as TraceGlobal)[FLAG] = true;

    trace("узел page")();
    note("адрес не разрешён");

    expect(debug).toHaveBeenCalledTimes(2);
    expect(debug.mock.calls[0]?.[0]).toContain("узел page");
    expect(debug.mock.calls[0]?.[0]).toMatch(/\d+\.\d\dms$/);
    expect(debug.mock.calls[1]?.[0]).toContain("адрес не разрешён");
  });

  it("выключенная возвращает закрытие, которое ничего не делает", () => {
    const close = trace("замер");
    expect(close()).toBeUndefined();
  });
});
