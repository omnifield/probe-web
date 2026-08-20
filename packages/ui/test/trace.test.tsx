// Трейсы — часть DoD зоны, значит и предмет теста. Проверяется не «функция есть», а
// поведение канала: молчит по умолчанию, включается флагом, и строка при размонтировании
// парная той, что была при монтировании.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Button } from "../src/button/index.js";
import { cleanup, mount } from "./dom.jsx";

const FLAG = "__PROBE_WEB_UI_TRACE__";

beforeEach(() => {
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  delete (globalThis as Record<string, unknown>)[FLAG];
  vi.restoreAllMocks();
});

describe("трейсы", () => {
  it("по умолчанию молчат", () => {
    mount(() => <Button>Ок</Button>);
    cleanup();

    expect(console.debug).not.toHaveBeenCalled();
  });

  it("под флагом пишут парные строки жизни узла", () => {
    (globalThis as Record<string, unknown>)[FLAG] = true;

    mount(() => <Button>Ок</Button>);
    expect(console.debug).toHaveBeenCalledTimes(1);
    const [mountLine] = vi.mocked(console.debug).mock.calls[0] as [string];
    expect(mountLine).toContain("ui.button mount");

    cleanup();
    expect(console.debug).toHaveBeenCalledTimes(2);
    const [disposeLine] = vi.mocked(console.debug).mock.calls[1] as [string];
    expect(disposeLine).toContain("ui.button dispose");

    // Общий идентификатор — это и есть «парность»: по нему в дампе видно, какой именно
    // экземпляр не умер или инстанцировался дважды.
    const id = mountLine.split("—")[1]?.trim();
    expect(id).toBeTruthy();
    expect(disposeLine).toContain(id as string);
  });

  it("не наследуются между тестами — флаг снимается вместе с прогоном", () => {
    mount(() => <Button>Ок</Button>);

    expect(console.debug).not.toHaveBeenCalled();
  });
});
