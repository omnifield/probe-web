// ПРОБА: оформление цепляется за `data-slot`, а не за классы и не за структуру DOM.
//
// Ловит тихую поломку: кит переименовал внутренний класс или переставил узлы — правило
// перестало применяться, и никто не заметил, потому что ничего не упало. Имена классов и
// разметка объявлены внутренним делом кита, а `data-slot` — его контрактом (kb:PROBEWEB-4).

import { describe, expect, it } from "vitest";

import { allSkinCss, selectors, skinFiles } from "./css.js";

/** Селекторы, которым зацепка не нужна, и почему. */
const ALLOWED_WITHOUT_SLOT = new Set([
  // Ключевые кадры: `to`/`from` — не селекторы элементов.
  "to",
  "from",
]);

/**
 * ЗАЦЕПКИ, КОТОРЫЕ НОСЯТ ВИД КНОПКИ, НЕ БУДУЧИ КНОПКОЙ.
 *
 * `<PopoverTrigger>Текст</PopoverTrigger>` — законная простая разметка: узел обязан выглядеть
 * контролом, и его вид повторяет кнопку. Но тот же триггер бывает СОСТАВНЫМ
 * (`as={Button}`) — тогда у него есть настоящий вид кнопки с выбранным вариантом, а наш
 * нейтральный повтор лёг бы поверх: файлы всплывающих идут после `button.css`, специфичность
 * равная, побеждает порядок. `data-variant="danger"` тихо стал бы обычной кнопкой.
 *
 * Поэтому каждое такое правило обязано исключать составной узел. Реестр ведётся руками:
 * «этот триггер носит вид кнопки» — утверждение о примитиве, а формально от `tabs-trigger`
 * (у него вид свой, кнопкой он не бывает) его не отличить.
 */
const BARE_TRIGGER_LOOK = [
  "dialog-trigger",
  "alert-dialog-trigger",
  "popover-trigger",
  "dropdown-menu-trigger",
  "context-menu-trigger",
  "menubar-trigger",
  "navigation-menu-trigger",
];

/** Исключение составного узла, без которого повтор перебивает настоящую кнопку. */
const NOT_COMPOSED = ':not([data-slot~="button"])';

/** Подлежащее селектора — последнее звено, к которому и применяются объявления. */
function subject(selector: string): string {
  const parts = selector.split(/\s+(?![^[]*\])/).filter((p) => !">+~".includes(p));
  return parts.at(-1) ?? selector;
}

describe("повтор вида кнопки не перебивает настоящую кнопку", () => {
  for (const file of skinFiles()) {
    const targets = () =>
      selectors(file.text).filter((s) =>
        BARE_TRIGGER_LOOK.some((slot) => subject(s).includes(`[data-slot~="${slot}"]`)),
      );

    if (targets().length === 0) continue;

    it(`${file.name}: правила вида голого триггера исключают составной узел`, () => {
      const bad = targets().filter((s) => !subject(s).includes(NOT_COMPOSED));

      expect(bad, `без ${NOT_COMPOSED} — ляжет поверх кнопки в ${file.name}`).toEqual([]);
    });
  }

  it("реестр не разошёлся с поставкой", () => {
    // Запись, которой нет в поставке, делает проверку выше пустой и не роняет ничего.
    const css = allSkinCss();
    const ghosts = BARE_TRIGGER_LOOK.filter((slot) => !css.includes(`[data-slot~="${slot}"]`));

    expect(ghosts, "зацепки нет в поставке — запись в реестре мертва").toEqual([]);
  });
});

describe("оформление цепляется за data-slot", () => {
  for (const file of skinFiles()) {
    it(`${file.name}: каждый селектор содержит [data-slot~=…]`, () => {
      const bad = selectors(file.text).filter(
        (s) => !ALLOWED_WITHOUT_SLOT.has(s) && !s.includes("[data-slot~="),
      );

      expect(bad, `селекторы без зацепки в ${file.name}`).toEqual([]);
    });

    it(`${file.name}: зацепка читается списком, а не точным равенством`, () => {
      // ОПЛАЧЕНО ПОЛОМКОЙ. Кит выпустил цепочку зацепок при композиции: `<DialogTrigger
      // as={Button}>` рендерит ОДИН узел, и на нём `data-slot="button dialog-trigger"` — оба
      // имени. Под `[data-slot="button"]` такой узел не попадает, и оформление кнопки тихо
      // перестаёт применяться: ничего не падает, просто кнопка голая.
      //
      // `~=` совпадает со словом в списке, поэтому одиночному значению он не мешает и разбора
      // формы «одна зацепка или список» нам не требуется вовсе.
      const exact = [...file.text.matchAll(/\[data-slot=[^\]]*\]/g)].map(([hit]) => hit);

      expect(exact, `точное равенство в ${file.name} — составной узел мимо него`).toEqual([]);
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
