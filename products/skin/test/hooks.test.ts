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
 * ОПОРА НА ТЕГ, РАЗРЕШЁННАЯ ЯВНО — по одной записи, и каждая с чужим обещанием за спиной.
 *
 * Обычно тег в селекторе запрещён: кит вправе сменить `div` на `span` через `as`, и правило
 * отвалится молча. Но бывает узел, до которого зацепке не добраться физически, — тогда чужая
 * проба заменяет зацепку, и опора становится названным решением, а не случайной удачей.
 */
const TAG_BY_PROMISE: Record<string, string> = {
  // Список страниц: `<ul>` рендерит корень kobalte, `<li>` — сама часть, наружу они не выведены
  // (разбор owner-ui, 2026-08-17: `pagination-list` дать нечем). Взамен кит закрепил структуру
  // `nav > ul > li > [data-slot]` СВОЕЙ пробой — сменится разметка, покраснеет его прогон.
  '[data-slot~="pagination"] > ul': "структура закреплена пробой кита; зацепки для <ul> нет",
};

/**
 * ЗАЦЕПКИ, КОТОРЫЕ КИТ СОБИРАЕТ В ОДИН УЗЕЛ С КНОПКОЙ.
 *
 * Композиция `as={Button}` даёт ОДИН узел с обеими зацепками. На таком узле вид берёт КНОПКА —
 * вместе с вариантом, который выбрал потребитель, — а наш вид обязан уступить: файлы этих
 * семейств идут после `button.css`, специфичность равная, побеждает порядок. Без исключения
 * `data-variant="danger"` тихо становится обычной кнопкой, ссылка-кнопка получает подчёркнутую
 * подпись на сплошной заливке, а открывашка-кнопка теряет рамку и фон целиком.
 *
 * Реестр ведётся РУКАМИ: «этот примитив кит собирает с кнопкой» — утверждение о ките (их девять,
 * `tasker:PROBEWEB-50`), и формально от `tabs-trigger`, который кнопкой не бывает, его не
 * отличить. Лишняя запись здесь не опасна — исключение на узле, где `button` не появится, просто
 * ничего не меняет; опасна ПРОПУЩЕННАЯ, поэтому реестр стережётся с двух сторон.
 */
const COMPOSED_WITH_BUTTON = [
  "dialog-trigger",
  "alert-dialog-trigger",
  "popover-trigger",
  "dropdown-menu-trigger",
  "context-menu-trigger",
  "menubar-trigger",
  "navigation-menu-trigger",
  "collapsible-trigger",
  "accordion-trigger",
  "link",
  "toggle",
];

// `toggle-group-item` в реестре НЕТ намеренно, хотя исключение в `toggle.css` у него стоит: он
// делит правила с `toggle` одним списком селекторов, и там оно безвредно. А кит собирает с
// кнопкой сам `Toggle`, не пункт группы, — потребовав исключение везде, проба заставила бы
// снять с пункта ГЕОМЕТРИЮ группы (стык, скругления краёв), которая обязана работать всегда.
// Поймано этой же пробой: она покраснела на `toggle-group.css`, где правило про раскладку.

/** Исключение составного узла, без которого наш вид перебивает настоящую кнопку. */
const NOT_COMPOSED = ':not([data-slot~="button"])';

/**
 * Признаки правила СОСТОЯНИЯ, которому исключение не нужно.
 *
 * Граница проходит между видом и поведением: вид на составном узле даёт кнопка, а нажатость,
 * раскрытость и текущий пункт — это поведение примитива, и показывать их обязаны мы. Иначе
 * составной переключатель перестал бы показывать, что нажат.
 */
const STATE_MARKS = ["[data-pressed", "[data-expanded", "[data-current", "[data-disabled"];

/** Подлежащее селектора — последнее звено, к которому и применяются объявления. */
function subject(selector: string): string {
  const parts = selector.split(/\s+(?![^[]*\])/).filter((p) => !">+~".includes(p));
  return parts.at(-1) ?? selector;
}

describe("вид на составном узле уступает кнопке", () => {
  for (const file of skinFiles()) {
    const targets = () =>
      selectors(file.text).filter((s) => {
        const head = subject(s);
        if (!COMPOSED_WITH_BUTTON.some((slot) => head.includes(`[data-slot~="${slot}"]`))) {
          return false;
        }
        return !STATE_MARKS.some((mark) => head.includes(mark));
      });

    if (targets().length === 0) continue;

    it(`${file.name}: правила вида исключают составной узел`, () => {
      const bad = targets().filter((s) => !subject(s).includes(NOT_COMPOSED));

      expect(bad, `без ${NOT_COMPOSED} — ляжет поверх кнопки в ${file.name}`).toEqual([]);
    });
  }

  it("реестр не разошёлся с поставкой", () => {
    // Запись, которой нет в поставке, делает проверку выше пустой и не роняет ничего.
    const css = allSkinCss();
    const ghosts = COMPOSED_WITH_BUTTON.filter((slot) => !css.includes(`[data-slot~="${slot}"]`));

    expect(ghosts, "зацепки нет в поставке — запись в реестре мертва").toEqual([]);
  });

  it("ни один составимый китом примитив не забыт", () => {
    // Вторая сторона реестра. Пропущенная запись — молча перебитый вид, и увидеть его можно
    // только глазами на живой странице. Перечень назван китом: девять примитивов, где композиция
    // реальна. Те, у которых вида у нас нет вовсе (`tooltip-trigger`), в проверку не попадают —
    // уступать им нечем.
    const composable = [
      "toggle",
      "link",
      "dialog-trigger",
      "alert-dialog-trigger",
      "popover-trigger",
      "tooltip-trigger",
      "dropdown-menu-trigger",
      "collapsible-trigger",
    ];
    const css = allSkinCss();
    const missing = composable.filter(
      (slot) => css.includes(`[data-slot~="${slot}"]`) && !COMPOSED_WITH_BUTTON.includes(slot),
    );

    expect(missing, "кит собирает эту зацепку с кнопкой, а исключения у неё нет").toEqual([]);
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
      const byTag = selectors(file.text).filter(
        (s) =>
          !(s in TAG_BY_PROMISE) &&
          s
            .split(/\s+|>|\+|~/)
            .filter(Boolean)
            .some((part) => /^[a-z][a-z0-9]*$/i.test(part) && !ALLOWED_WITHOUT_SLOT.has(part)),
      );

      expect(byTag, `опора на теги в ${file.name}`).toEqual([]);
    });
  }
  it("разрешённая опора на тег ещё существует в поставке", () => {
    // Запись, которой в CSS больше нет, снимает запрет впустую: правило переехало на зацепку, а
    // исключение осталось и молча разрешает следующему автору опереться на тот же тег.
    const all = selectors(allSkinCss());
    const stale = Object.keys(TAG_BY_PROMISE).filter((selector) => !all.includes(selector));

    expect(stale, "исключение живёт, а селектора нет — снимите запись").toEqual([]);
  });

});
