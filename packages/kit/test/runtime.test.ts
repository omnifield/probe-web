// Рантайм-точка `mount()` вблизи: DOM-контракт `#root` и внятное падение без него.
// Сквозная проверка (собранное приложение → узел в разметке) живёт в `build.test.ts`.

import { afterEach, describe, expect, it, vi } from "vitest";

import { mount } from "../src/index.js";

const FLAG = "__PROBE_WEB_KIT_TRACE__";

afterEach(() => {
  document.body.innerHTML = "";
  delete (globalThis as Record<string, unknown>)[FLAG];
  vi.restoreAllMocks();
});

describe("mount()", () => {
  it("монтирует в #root, не спрашивая точку монтирования", () => {
    document.body.innerHTML = '<div id="root"></div>';

    mount(() => {
      const el = document.createElement("p");
      el.textContent = "смонтировано";
      return el;
    });

    expect(document.querySelector("#root p")?.textContent).toBe("смонтировано");
  });

  it("без #root падает с внятным сообщением, а не молча", () => {
    document.body.innerHTML = "<div></div>";

    expect(() => mount(() => document.createElement("p"))).toThrow(/#root/);
  });
});

describe("perf-трейсы", () => {
  it("по умолчанию молчат", () => {
    document.body.innerHTML = '<div id="root"></div>';
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    mount(() => document.createElement("p"));

    expect(debug).not.toHaveBeenCalled();
  });

  it("под глобальным флагом печатают длительность", () => {
    document.body.innerHTML = '<div id="root"></div>';
    (globalThis as Record<string, unknown>)[FLAG] = true;
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    mount(() => document.createElement("p"));

    expect(debug).toHaveBeenCalledTimes(1);
    expect(debug.mock.calls[0]?.[0]).toMatch(/\[probe-web-kit] mount — [\d.]+ms/);
  });
});
