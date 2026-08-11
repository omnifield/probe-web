// Поверхность зоны — проверяется НАСТОЯЩИМ импортом, в браузерных условиях.
//
// Живёт в проекте `dom`, а не рядом с тарболом: `@kobalte/core` при загрузке трогает
// клиентские API, и в серверных условиях Node модуль падает ещё на импорте. Это не дефект
// пакета — это ровно то, чем он является: библиотека компонентов для браузера.

import { describe, expect, it } from "vitest";

import * as ui from "../src/index.js";
import { EXPECTED_SURFACE } from "./surface-list.js";

describe("поверхность", () => {
  it("наружу торчит ровно обещанное — ни больше, ни меньше", () => {
    expect(Object.keys(ui).sort()).toEqual(EXPECTED_SURFACE);
  });

  it("каждая точка — функция-компонент, а не значение", () => {
    for (const name of EXPECTED_SURFACE) {
      expect(typeof ui[name as keyof typeof ui]).toBe("function");
    }
  });

  it("внутреннего наружу не уехало", () => {
    // Трейсы — инструментовка зоны, а не её обещание потребителю.
    expect(Object.keys(ui)).not.toContain("traceLife");
  });
});
