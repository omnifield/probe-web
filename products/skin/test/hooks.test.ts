// ПРОБА: оформление цепляется за `data-slot`, а не за классы и не за структуру DOM.
//
// Ловит тихую поломку: кит переименовал внутренний класс или переставил узлы — правило
// перестало применяться, и никто не заметил, потому что ничего не упало. Имена классов и
// разметка объявлены внутренним делом кита, а `data-slot` — его контрактом (kb:PROBEWEB-4).

import { describe, expect, it } from "vitest";

import { selectors, skinFiles } from "./css.js";

/** Селекторы, которым зацепка не нужна, и почему. */
const ALLOWED_WITHOUT_SLOT = new Set([
  // Ключевые кадры: `to`/`from` — не селекторы элементов.
  "to",
  "from",
]);

describe("оформление цепляется за data-slot", () => {
  for (const file of skinFiles()) {
    it(`${file.name}: каждый селектор содержит [data-slot=…]`, () => {
      const bad = selectors(file.text).filter(
        (s) => !ALLOWED_WITHOUT_SLOT.has(s) && !s.includes("[data-slot="),
      );

      expect(bad, `селекторы без зацепки в ${file.name}`).toEqual([]);
    });

    it(`${file.name}: ни один селектор не цепляется за класс`, () => {
      // Класс в селекторе поставки означает опору на чужое внутреннее имя. Свои классы у нас
      // есть только у стенда (`src/playground`), и он в поставку не входит.
      const withClass = selectors(file.text).filter((s) => /\.[a-z]/i.test(s));

      expect(withClass, `классы в селекторах ${file.name}`).toEqual([]);
    });

    it(`${file.name}: ни один селектор не опирается на имена тегов`, () => {
      // Тег — тоже структура: кит вправе сменить `div` на `span` через `as`, и правило
      // отвалится молча. Разрешены только сочетания с зацепкой.
      const byTag = selectors(file.text).filter((s) =>
        s
          .split(/\s+|>|\+|~/)
          .filter(Boolean)
          .some((part) => /^[a-z][a-z0-9]*$/i.test(part) && !ALLOWED_WITHOUT_SLOT.has(part)),
      );

      expect(byTag, `опора на теги в ${file.name}`).toEqual([]);
    });
  }
});
