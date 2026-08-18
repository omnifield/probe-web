// ПРОБА: сгенерированные файлы пресетов не отстали от источника.
//
// Пресет описан объектом, а уезжает файлом. Между ними шаг генерации — а значит место, где они
// расходятся молча: поправил семя, забыл перегенерировать, приложение получило прежний вид.
// Ошибку такого рода не видно ни в стенде (он читает объект), ни в приложении (оно читает файл).
//
// Сверка идёт с ГЕНЕРАТОРОМ БАЗЫ: своего в зоне нет (`kb:PROBEWEB-15`, решение 2). Поэтому проба
// стережёт заодно и второе — что файл в репозитории не отстал от формулы ступеней базы.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { themeModelToCss } from "@omnifield/probe-web-style";
import { describe, expect, it } from "vitest";

import { BUILT_IN } from "../src/presets/built-in.js";
import * as model from "../src/presets/model.js";
import { modelOf } from "../src/presets/model.js";
import { ZONE } from "./css.js";

describe("файлы пресетов", () => {
  for (const preset of BUILT_IN) {
    it(`«${preset.title}»: файл совпадает с описанием`, () => {
      const path = join(ZONE, "src", "presets", "css", `${preset.id}.css`);
      const onDisk = readFileSync(path, "utf8");

      expect(
        onDisk,
        `файл пресета отстал от источника — перегенерируйте: pnpm run build:presets`,
      ).toBe(themeModelToCss(modelOf(preset)));
    });
  }
});

/**
 * ПОВЕРХНОСТЬ ПРЕСЕТА — всё, где мог бы завестись второй генератор: модель, стенд, оба скрипта.
 *
 * `scripts/build-icons.mjs` сюда намеренно не входит: он тоже собирает CSS, но собирает ЗНАЧКИ
 * (`--icon-*`), а не вид пресета, и к переезду генератора отношения не имеет.
 */
function presetSources(): { name: string; text: string }[] {
  const files: { name: string; text: string }[] = [];

  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path, `${prefix}${entry}/`);
      else if (/\.(?:ts|tsx|mjs)$/.test(entry)) {
        files.push({ name: `${prefix}${entry}`, text: readFileSync(path, "utf8") });
      }
    }
  };

  walk(join(ZONE, "src", "presets"), "src/presets/");
  walk(join(ZONE, "src", "playground"), "src/playground/");
  for (const one of ["build-presets.mjs", "seed-presets.mjs"]) {
    files.push({ name: `scripts/${one}`, text: readFileSync(join(ZONE, "scripts", one), "utf8") });
  }

  return files;
}

describe("генератор вида живёт в базе, а не в зоне", () => {
  // `kb:PROBEWEB-15`, решение 2. Своя реализация была здесь и уехала: пока их две, из одной
  // модели рождаются два результата, и расходятся они молча — в день, когда база улучшит
  // формулу ступеней. Проба стережёт возврат: словами такое правило не держится.

  it("ни одна строка зоны не собирает объявления вида", () => {
    // Признак сборки — объявление пользовательского свойства, склеенное из кусков: `--x: ${…}`.
    const ASSEMBLES = /--[^\n`]*:\s*\$\{/;

    const bad = presetSources()
      .filter((file) => ASSEMBLES.test(file.text))
      .map((file) => file.name);

    expect(bad, "в зоне снова собирают CSS пресета — строку собирает themeModelToCss").toEqual([]);
  });

  it("ни одна строка зоны не открывает блок темы", () => {
    // Второй признак: селектор `[data-theme="…"]`, за которым открывается блок. Атрибут зона
    // читает и ставит (`root.dataset.theme`) — это не сборка; сборка это `{` следом.
    const OPENS_BLOCK = /\[data-theme=[^\]\n]*\][^\n`]*\{\\n/;

    const bad = presetSources()
      .filter((file) => OPENS_BLOCK.test(file.text))
      .map((file) => file.name);

    expect(bad, "в зоне снова открывают блок темы").toEqual([]);
  });

  it("модель пресета отдаёт наружу модель, а не готовый CSS", () => {
    // Шов с базой ровно один — `modelOf()`. `cssOf()` уехал вместе с генератором; вернувшееся
    // имя означало бы, что вернулась и вторая реализация.
    expect(typeof model.modelOf).toBe("function");
    expect(Object.keys(model)).not.toContain("cssOf");
  });
});
