// Трейсы приложения — часть DoD, а не отладочный мусор: включённые каналы всех зон дают одну
// ленту от `mount()` до отправки. Проверяется ровно два свойства: молчит по умолчанию и
// говорит по флагу. Первое важнее второго — трейс, который печатает всегда, отключают целиком,
// и канала не остаётся.

import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/app";
import { cleanup, mount, one, type } from "./dom";

const FLAG = "__PROBE_WEB_REFERENCE_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

afterEach(() => {
  cleanup();
  delete (globalThis as TraceGlobal)[FLAG];
  vi.restoreAllMocks();
});

/**
 * Строки нашего канала — чужие (например, от кита) не считаем.
 *
 * Шпион описан СТРУКТУРНО, а не через `ReturnType<typeof vi.spyOn>`: тот generic, и его
 * `mock.calls` разворачивается в `any[]` — в приложении, доказывающем типизацию цепочки,
 * `any` быть не должно нигде (`tasker:PROBEWEB-14`).
 */
function ours(spy: { mock: { calls: unknown[][] } }): string[] {
  return spy.mock.calls
    .map((call) => String(call[0]))
    .filter((line) => line.startsWith("[probe-web-reference]"));
}

describe("канал трейсов", () => {
  it("по умолчанию молчит", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    mount(() => <App />);

    expect(ours(debug)).toEqual([]);
  });

  it("по флагу отдаёт замер настройки экрана", () => {
    (globalThis as TraceGlobal)[FLAG] = true;
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    mount(() => <App />);

    expect(ours(debug).some((line) => line.includes("app.setup"))).toBe(true);
  });

  it("по флагу отдаёт длительность отправки — единственной асинхронной части", async () => {
    (globalThis as TraceGlobal)[FLAG] = true;
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    const host = mount(() => <App send={() => Promise.resolve()} />);
    type(one<HTMLInputElement>(host, '[data-slot="input"]'), "me@example.com");
    one<HTMLButtonElement>(host, '[data-slot="button"]').click();
    await Promise.resolve();

    expect(ours(debug).some((line) => line.includes("app.submit"))).toBe(true);
  });
});
