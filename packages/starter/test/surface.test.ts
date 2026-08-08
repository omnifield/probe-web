// ЗАМОРОЖЕННАЯ ПОВЕРХНОСТЬ. Скелет едет placed-once: файлы, которые он положит, зовут kit
// вечно и той версией вызова, какой их положили. Значит замораживается не файл, а ПОВЕРХНОСТЬ,
// которую скелет трогает, — и держать её узкой обязан именно этот пакет (`kb:PROBEWEB-2`).
//
// Проба сторожит ЧИСЛО касаний, а не их правильность: правильность судят пробы kit. Здесь
// падает попытка позвать из скелета что-то сверх трёх точек — то есть заморозить больше.

import { describe, expect, it } from "vitest";

import { declaration, readTemplate } from "./source.js";

const KIT = "@omnifield/probe-web-kit";

/** Три точки контракта — и ни одной больше без мажора и разговора с architect. */
const FROZEN_ENTRYPOINTS = [KIT, `${KIT}/tsconfig`, `${KIT}/vite`];

/** Что скелет зовёт по именам: рантайм и сборка. Типы точки входа не имеют. */
const FROZEN_IMPORTS = ["defineConfig", "mount"];

/** Каждое упоминание kit во всех файлах груза: `from "…"` и `"extends": "…"`. */
function kitReferences(): string[] {
  const found: string[] = [];
  for (const entry of declaration.layout) {
    const text = readTemplate(entry.src);
    for (const match of text.matchAll(
      new RegExp(String.raw`["']${KIT}(/[a-z/-]*)?["']`, "g"),
    )) {
      found.push(`${KIT}${match[1] ?? ""}`);
    }
  }
  return found;
}

describe("поверхность kit, вызываемая скелетом", () => {
  it("трогает ровно три точки", () => {
    expect([...new Set(kitReferences())].sort()).toEqual(FROZEN_ENTRYPOINTS);
  });

  it("зовёт по именам только mount и defineConfig", () => {
    const names = new Set<string>();
    for (const entry of declaration.layout) {
      for (const match of readTemplate(entry.src).matchAll(
        new RegExp(String.raw`import\s*\{([^}]*)\}\s*from\s*["']${KIT}[^"']*["']`, "g"),
      )) {
        for (const name of (match[1] ?? "").split(",")) {
          if (name.trim() !== "") {
            names.add(name.trim());
          }
        }
      }
    }
    expect([...names].sort()).toEqual(FROZEN_IMPORTS);
  });

  it("не тянет из kit ничего мимо объявленных точек", () => {
    // Глубокий путь (`…/dist/…`, `…/src/…`) заморозил бы внутренности, которые kit
    // считает своими и ломает свободно.
    for (const reference of kitReferences()) {
      expect(FROZEN_ENTRYPOINTS, reference).toContain(reference);
    }
  });
});

describe("точка входа скелета", () => {
  const main = readTemplate("main.tsx");

  it("монтирует приложение одним вызовом", () => {
    expect(main).toContain(`import { mount } from "${KIT}";`);
    expect(main.match(/\bmount\(/g)).toHaveLength(1);
  });

  it("не ищет точку монтирования сама", () => {
    // `#root` ищет kit — в сигнатуре её нет намеренно, иначе способ разметки страницы
    // оказался бы заморожен заодно (`kb:PROBEWEB-2`).
    expect(main).not.toContain("getElementById");
    expect(main).not.toContain("querySelector");
  });

  it("не тянет solid напрямую", () => {
    // Скелету достаточно JSX, который настроен базой типов kit. Прямой импорт
    // `solid-js` заморозил бы ещё и его API у каждого потребителя.
    expect(main).not.toContain("solid-js");
  });
});
