// Смоук-проба persistAtom: гидратация из storage при вызове + запись при каждом .set().
// Реальный localStorage/sessionStorage из jsdom, не мок.
import { createAtom } from "@xstate/store";
import { createJSONStorage } from "@xstate/store/persist";
import { beforeEach, describe, expect, it } from "vitest";

import { persistAtom } from "../src/addons/persist.js";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("persistAtom", () => {
  it("гидрирует атом из localStorage при вызове", () => {
    localStorage.setItem("counter", JSON.stringify(5));
    const atom = persistAtom(createAtom(0), { name: "counter" });
    expect(atom.get()).toBe(5);
  });

  it("пишет в localStorage при каждом .set()", () => {
    const atom = persistAtom(createAtom(0), { name: "counter" });
    atom.set(3);
    expect(localStorage.getItem("counter")).toBe(JSON.stringify(3));
  });

  it("localStorage по умолчанию не трогает sessionStorage", () => {
    const atom = persistAtom(createAtom(0), { name: "counter" });
    atom.set(3);
    expect(sessionStorage.getItem("counter")).toBeNull();
  });

  it("storage: createJSONStorage(() => sessionStorage) переключает на session", () => {
    const atom = persistAtom(createAtom(0), {
      name: "counter",
      storage: createJSONStorage(() => sessionStorage),
    });
    atom.set(7);
    expect(sessionStorage.getItem("counter")).toBe(JSON.stringify(7));
    expect(localStorage.getItem("counter")).toBeNull();
  });

  it("без записи в storage атом остаётся на начальном значении", () => {
    const atom = persistAtom(createAtom(42), { name: "missing-key" });
    expect(atom.get()).toBe(42);
  });
});
