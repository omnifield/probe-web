// ПРОБА: всё оформление лежит в слое `skin`, и слой объявлен первым.
//
// Зачем. Безслойные объявления выигрывают у любого слоя независимо от специфичности
// (CSS Cascade 5, §6.1) — на этом держится обещание «поставь свой бренд обычным правилом, без
// `!important`». Одно правило, выпавшее из слоя, ломает обещание ровно для того компонента,
// который потребитель захочет перекрасить, — и молча.
//
// Второе: порядок слоя задаётся местом ПЕРВОГО упоминания (§6.4.3). Поэтому объявление живёт
// отдельным файлом `base.css`, а не внутри первого попавшегося.

import { describe, expect, it } from "vitest";

import { skinFile, skinFiles, stripComments } from "./css.js";

describe("оформление лежит в слое skin", () => {
  it("base.css объявляет слой и не содержит ни одного правила", () => {
    const base = stripComments(skinFile("base.css")).trim();

    expect(base).toContain("@layer skin;");
    // Ни одной фигурной скобки: объявление слоя — единственное, что здесь есть.
    expect(base.includes("{"), "в base.css появилось правило вида").toBe(false);
  });

  it("skin.css импортирует base.css первым", () => {
    const imports = [...stripComments(skinFile("skin.css")).matchAll(/@import\s+"([^"]+)"/g)].map(
      ([, path]) => path,
    );

    expect(imports[0]).toBe("./base.css");
  });

  it("skin.css собирает все файлы оформления", () => {
    const imported = new Set(
      [...stripComments(skinFile("skin.css")).matchAll(/@import\s+"\.\/([^"]+)"/g)].map(
        ([, name]) => name,
      ),
    );

    const missing = skinFiles()
      .map((f) => f.name)
      .filter((name) => !imported.has(name));

    expect(missing, "файлы, не попавшие в сборный skin.css").toEqual([]);
  });

  for (const file of skinFiles()) {
    if (file.name === "base.css") continue;

    it(`${file.name}: каждое правило внутри @layer skin`, () => {
      const css = stripComments(file.text);

      // Считаем глубину скобок и проверяем, что любое правило открывается не на верхнем
      // уровне, а внутри блока `@layer skin { … }`.
      const layerStart = css.indexOf("@layer skin {");
      expect(layerStart, `в ${file.name} нет блока @layer skin`).toBeGreaterThanOrEqual(0);

      const before = css.slice(0, layerStart);
      expect(before.includes("{"), `в ${file.name} есть правило ДО слоя`).toBe(false);

      // Всё, что после закрытия слоя, — тоже вне его.
      let depth = 0;
      let end = -1;
      for (let i = layerStart; i < css.length; i += 1) {
        if (css[i] === "{") depth += 1;
        if (css[i] === "}") {
          depth -= 1;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }

      const after = css.slice(end + 1);
      expect(after.includes("{"), `в ${file.name} есть правило ПОСЛЕ слоя`).toBe(false);
    });
  }
});
