// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`) — не поставка, не вкус продукта. Кит держит «ноль стилей по
// умолчанию» (README, «Четыре принципа»), и этот файл её не нарушает: он живёт рядом с
// компонентом, но НИКУДА не экспортируется из `index.ts`/`passport.ts`/`kit.ts` — его читает
// только `accordion.test.tsx`, доказывая, что паспорт гармошки МОЖНО одеть целиком настоящей
// механикой скина (`skinGaps` пусто, CSS порождается, живой браузер раскрывает и закрывает
// разделы кадрами). Раньше то же самое доказывал отдельный пакет `packages/skin-reference`
// (снесён, `PWEB-110`) — теперь компонент доказывает себя сам, в своей же папке.
//
// Перенесено построчно из `packages/skin-reference/src/recipes.ts` (git-история цела на
// `git show 5d560ae:packages/skin-reference/src/recipes.ts`); вид не менялся при переезде —
// нашедшееся стоит отдельной темой, а не смешивается с переносом.
//
// ## Цвет адресуется СТУПЕНЬЮ, а не значением
//
// Ни одного цветового литерала: правило называет ступень (`var(--accent-9)`), и от этого скин
// пересеваем. Ступени назначены зоной значений — 9 сплошной акцент, 10 он же при наведении,
// 8 сильная граница и кольцо фокуса, 11 текст низкого контраста, 12 высокого.
//
// Заливка и текст объявляются В ОДНОМ правиле везде, где есть текст: счёт читаемости считает
// ПАРУ, и текст без названного рядом фона уезжает у него в «посчитать нечем».

import type { Form, Keyframes, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Переход вида — тот же приём, что у кнопки: разные длительности у соседних узлов — брак. */
const переход = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

/**
 * РАСКРЫТИЕ И ЗАКРЫТИЕ — именованные движения гармошки (`PWEB-98`).
 *
 * Мера у обоих одна и чужая: `--height` кладёт кит, измерив узел, и кладёт её на то самое
 * содержимое, где движение и применено. Ступень движения разрешается на АНИМИРУЕМОМ элементе
 * (`PWEB-101`), поэтому имя здесь законно — и другого способа взять высоту нет: `auto` не
 * анимируется, а придумать число за чужое содержимое нельзя.
 *
 * ОТСТУП ЕДЕТ ВМЕСТЕ С ВЫСОТОЙ, и это не украшение. Содержимое считает коробку внешней мерой
 * (`box-sizing: border-box` в базе), а при внешней мере нулевая высота отступы НЕ убирает —
 * коробка упёрлась бы в них и осталась бы на два отступа выше нуля. Схлопнутый раздел стал бы
 * полоской.
 *
 * Двумя движениями, а не одним с обратным проигрыванием: обратное направление задаётся правилом
 * (`animation-direction`), то есть тем же адресом, а адреса у раскрытия и закрытия РАЗНЫЕ —
 * первый приезжает не всегда, второй всегда.
 *
 * СВЕРЕНО С РЫНКОМ 2026-08-24. Поставщик документирует ровно эту запись — `--height` в кадрах и
 * `[data-part="item-content"][data-state="open"|"closed"]` в правилах (`ark-ui.com`, страницы
 * «Accordion» и «Collapsible»). Штатный ответ CSS на «анимировать до `auto`»
 * (`interpolate-size: allow-keywords` вместе с `calc-size()`) НЕ берём: он остаётся только в
 * Chromium — ни Firefox, ни Safari его не знают.
 */
export const keyframes: Keyframes = {
  раскрытие: {
    from: { height: "0", paddingBlock: "0" },
    to: { height: "var(--height)", paddingBlock: "var(--space-3)" },
  },
  закрытие: {
    from: { height: "var(--height)", paddingBlock: "var(--space-3)" },
    to: { height: "0", paddingBlock: "0" },
  },
  /**
   * РАСКРЫТИЕ ВБОК — тем же приёмом, по другой оси (`PWEB-105`).
   *
   * `--width` паспорт объявляет РЯДОМ с `--height`, тем же словом «нужна горизонтальной
   * гармошке». Ось вариаций тут ни при чём: горизонталь — это `settings.orientation`, чем
   * компонент ОКАЗАЛСЯ, а не что выбрал автор скина, и адрес для неё — тот же путь, что у
   * вариации.
   *
   * Ось складывается ИНЛАЙНОВЫМ отступом, а не блочным: `paddingInline` лежит на той же стороне
   * коробки, что и `width`, — симметрия с вертикалью, где `paddingBlock` лежит на стороне
   * `height`.
   */
  "раскрытие-вбок": {
    from: { width: "0", paddingInline: "0" },
    to: { width: "var(--width)", paddingInline: "var(--space-4)" },
  },
  "закрытие-вбок": {
    from: { width: "var(--width)", paddingInline: "var(--space-4)" },
    to: { width: "0", paddingInline: "0" },
  },
};

/**
 * ГАРМОШКА. Пять частей и пятнадцать состояний.
 *
 * Раскрытый вид содержимого адресуется через предка: свой признак раскрытия у содержимого
 * приезжает не всегда, и паспорт объявляет это прямо. Без адреса по предку такое правило
 * выразить нельзя вовсе — ради этого поле в модели и заведено.
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        borderRadius: "var(--radius-lg)",
        background: "var(--neutral-1)",
        color: "var(--neutral-12)",
      },
    },
    item: {
      props: {
        display: "flex",
        flexDirection: "column",
        background: "var(--neutral-1)",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        overflow: "hidden",
      },
      states: {
        open: { props: { borderColor: "var(--neutral-7)" } },
        disabled: { props: { opacity: "0.5" } },
        focus: { props: { borderColor: "var(--accent-8)" } },
      },
    },
    itemTrigger: {
      props: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        background: "var(--neutral-3)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        textAlign: "start",
        cursor: "pointer",
        transition: переход,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { background: "var(--neutral-4)", color: "var(--neutral-12)" } },
        hover: { props: { background: "var(--neutral-4)", color: "var(--neutral-12)" } },
        active: { props: { background: "var(--neutral-5)", color: "var(--neutral-12)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "calc(var(--border-width-2) * -1)",
          },
        },
        focus: { props: { color: "var(--neutral-12)", background: "var(--neutral-4)" } },
        disabled: { props: { cursor: "not-allowed", opacity: "0.6" } },
      },
    },
    itemContent: {
      props: {
        paddingInline: "var(--space-4)",
        paddingBlock: "var(--space-3)",
        background: "var(--neutral-1)",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-relaxed)",
        // РАСКРЫТИЕ ПИШЕТ СКИН (`PWEB-93`), ИМЕНОВАННЫМ ДВИЖЕНИЕМ (`PWEB-98`). Мера у кита
        // ВНЕШНЯЯ (`getBoundingClientRect`), значит и коробка здесь внешняя — иначе
        // `height: var(--height)` прибавил бы к чужой мере ещё два своих отступа.
        overflow: "hidden",
        boxSizing: "border-box",
        transition: переход,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        // РАСКРЫТИЕ — по СВОЕМУ признаку, тому самому, что приезжает не всегда (`PWEB-97`).
        open: {
          props: {
            animation: "раскрытие var(--motion-normal) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
        // ЗАКРЫТИЕ — по признаку закрытости; он у содержимого приезжает всегда.
        closed: {
          props: {
            animation: "закрытие var(--motion-normal) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
        disabled: { props: { color: "var(--neutral-11)", background: "var(--neutral-2)" } },
        focus: { props: { color: "var(--neutral-12)", background: "var(--neutral-1)" } },
      },
      ancestors: [
        {
          // Раскрытое содержимое — по состоянию ВЛАДЕЛЬЦА: свой признак у содержимого приезжает
          // не всегда, и паспорт говорит об этом прямо.
          //
          // КОРОБКИ ЗДЕСЬ БОЛЬШЕ НЕТ, и это не вкус. Кит меряет узел ДВАЖДЫ — раскрывая и
          // закрывая, — а закрывая, меряет содержимое, чей пункт УЖЕ не раскрыт. Правило по
          // предку, меняющее коробку, во вторую меру не попадает.
          component: "accordion",
          part: "item",
          states: ["open"],
          style: { props: { color: "var(--neutral-12)" } },
        },
      ],
    },
    itemIndicator: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--neutral-11)",
        background: "var(--neutral-3)",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { transform: "rotate(180deg)" } },
        disabled: { props: { opacity: "0.6" } },
        focus: { props: { color: "var(--neutral-12)", background: "var(--neutral-3)" } },
      },
    },
  },
  /**
   * ГОРИЗОНТАЛЬНАЯ РАСКЛАДКА (`PWEB-105`) — то, чем компонент ОКАЗАЛСЯ, а не что выбрал автор
   * скина. Кит и вертикаль здесь не тронуты: база гармошки осталась прежней, а условие живёт
   * РЯДОМ, тем же путём, что и вариация, — своей ветки резолва для него не заведено.
   */
  settings: {
    orientation: {
      horizontal: {
        root: { props: { flexDirection: "row" } },
        item: { props: { flexDirection: "row" } },
        itemContent: {
          states: {
            open: {
              props: {
                animation: "раскрытие-вбок var(--motion-normal) var(--ease-out)",
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              },
            },
            closed: {
              props: {
                animation: "закрытие-вбок var(--motion-normal) var(--ease-out)",
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              },
            },
          },
        },
      },
    },
  },
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "гармошка-проба", component: "accordion", recipe, keyframes };
