// ПРОБА: сгенерированные файлы пресетов не отстали от источника.
//
// Пресет описан объектом, а уезжает файлом. Между ними шаг генерации — а значит место, где они
// расходятся молча: поправил семя, забыл перегенерировать, приложение получило прежний вид.
// Ошибку такого рода не видно ни в стенде (он читает объект), ни в приложении (оно читает файл).

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BUILT_IN } from "../src/presets/built-in.js";
import { cssOf } from "../src/presets/model.js";
import { ZONE } from "./css.js";

describe("файлы пресетов", () => {
  for (const preset of BUILT_IN) {
    it(`«${preset.title}»: файл совпадает с описанием`, () => {
      const path = join(ZONE, "src", "presets", "css", `${preset.id}.css`);
      const onDisk = readFileSync(path, "utf8");

      expect(
        onDisk,
        `файл пресета отстал от источника — перегенерируйте: pnpm run build:presets`,
      ).toBe(cssOf(preset));
    });
  }
});
