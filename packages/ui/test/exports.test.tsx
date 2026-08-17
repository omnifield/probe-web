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

  it("каждая точка — функция-компонент, кроме одной названной", () => {
    // `toaster` — очередь уведомлений: объект с `show` / `update` / `dismiss` / `clear`.
    // Это единственная точка поверхности, которую не ставят в разметку, а зовут из кода
    // (`src/toast.tsx`). Исключение названо ЯВНО, чтобы вторая такая не проехала молча.
    const NOT_A_COMPONENT = new Set(["toaster"]);

    for (const name of EXPECTED_SURFACE) {
      const value = ui[name as keyof typeof ui];

      if (NOT_A_COMPONENT.has(name)) {
        expect(typeof value).toBe("object");
        continue;
      }

      expect(typeof value).toBe("function");
    }
  });

  it("внутреннего наружу не уехало", () => {
    // Трейсы — инструментовка зоны, а не её обещание потребителю.
    expect(Object.keys(ui)).not.toContain("traceLife");
  });
});
