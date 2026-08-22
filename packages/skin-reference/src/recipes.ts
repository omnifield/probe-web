// РЕЦЕПТЫ ЭТАЛОНА — по одному на компонент кита, у которого есть паспорт. Сегодня их пять.
//
// ## РЕШЕНИЕ: покрытие ПОЛНОЕ, и это проба, а не обещание
//
// Каждая объявленная часть и каждое объявленное состояние всех пятерых адресованы хотя бы одним
// правилом. `skinGaps` по паспортам кита отвечает пустым перечнем, и это проверяется машиной
// (`test/coverage.test.ts`), а не заявляется здесь.
//
// Выбрано так по причине, которая у эталона своя. Скин вправе одевать ЧАСТЬ кита — неодетое это
// долг, а не поломка, — но эталон существует ради доказательства, что механика работает целиком.
// Непокрытая координата в нём это не скромность, а координата, на которой механика НЕ ПРОВЕРЕНА:
// адрес не порождён, каскад не сложен, читаемость не посчитана. Продуктовому скину такое можно,
// доказательству — нет.
//
// Цена решения названа: покрывать пришлось и то, что человек одевал бы не сразу, — например
// отключённый указатель раскрытия. Правила там скромные и намеренно скромные: их предмет —
// «координата адресуема», а не «так красивее».
//
// ## РЕШЕНИЕ: сколько вариаций
//
// Имена вариаций паспорту не принадлежат — их создаёт человек, и разные скины вправе знать
// разные. Значит число вариаций это решение автора, и вот оно:
//
//   • **кнопка — три** (`главная`, `тихая`, `опасная`) плюс умолчание. Кнопка выбрана нести ось
//     целиком: на ней и умолчание, и пересечения вариации с состоянием. Меньше трёх не хватило
//     бы — с двумя «пересечение по нескольким вариациям сразу» выродилось бы в «по одной»;
//   • **поверхность — две** (`обычная`, `приподнятая`) плюс умолчание. Второй носитель оси, и
//     нарочно с другим числом имён: одинаковое число у всех читалось бы как требование;
//   • **гармошка, поток, сетка — НИ ОДНОЙ.** Ось у них в паспорте объявлена, и это ровно тот
//     случай, который стоит показать: объявленная ось скина ни к чему не обязывает. Скин, не
//     давший ни одного имени, законен, а компонент остаётся в базовом виде.
//
// Больше имён эталон не заводит намеренно: вкус — предмет продуктового скина, а каждое лишнее
// имя здесь читалось бы как рекомендованный набор.
//
// ## Цвет адресуется СТУПЕНЬЮ, а не значением
//
// Ни одного цветового литерала: правило называет ступень (`var(--бренд-9)`), и от этого скин
// пересеваем. Ступени назначены зоной значений — 9 сплошной акцент, 10 он же при наведении,
// 8 сильная граница и кольцо фокуса, 11 текст низкого контраста, 12 высокого, `contrast` — текст
// поверх сплошной. Правило, написанное против назначения, сломало бы обещания контраста, и
// сломало бы молча.
//
// Заливка и текст объявляются В ОДНОМ правиле везде, где есть текст. Это не стилистика: счёт
// читаемости считает ПАРУ, и текст без названного рядом фона уезжает у него в «посчитать нечем».

import type { SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Переход вида — один на весь эталон: разные длительности у соседних кнопок выглядят браком. */
const переход = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

/**
 * КНОПКА. Одна часть, семь состояний, три вариации.
 *
 * Высота берётся ступенью `--control-height-md`, а не порогом нормы: при плотности 1 ступень
 * выше минимального размера цели с запасом, и спорить с нормой записью вида эталону незачем.
 */
const кнопка: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        letterSpacing: "var(--tracking-normal)",
        cursor: "pointer",
        transition: переход,
        // ВЛОЖЕНИЕМ, и оно здесь по существу: человек, попросивший систему двигать поменьше,
        // просил об этом всерьёз. Это же единственное место эталона, где формы вывода
        // РАСХОДЯТСЯ ПО ФОРМЕ, — вложенная оставляет at-правило внутри правила, плоская
        // выносит наверх. Гейт совпадения стоит ровно на том, что вид от этого не меняется.
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        // Кольцо фокуса — восьмая ступень: она и есть «сильная граница и кольцо фокуса», и
        // именно на неё дано обещание контраста против фонов приложения.
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--бренд-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        hover: { props: { cursor: "pointer" } },
        active: { props: { transform: "translateY(var(--border-width-1))" } },
        disabled: {
          props: { opacity: "0.5", cursor: "not-allowed" },
          // Пересечение вложением: у отключённой кнопки наведения быть не должно.
          states: { hover: { props: { transform: "none" } } },
        },
        busy: { props: { cursor: "progress" } },
        // Раскрытая и нажатая — состояния кнопки-переключателя: она остаётся видимо включённой,
        // пока раскрыт её список или пока она нажата.
        expanded: { props: { borderColor: "var(--бренд-8)" } },
        pressed: { props: { borderColor: "var(--бренд-8)", fontWeight: "var(--weight-semibold)" } },
      },
    },
  },
  variants: {
    главная: {
      root: {
        props: {
          background: "var(--бренд-9)",
          color: "var(--бренд-contrast)",
          // Рамка есть и невидима НАМЕРЕННО: она держит коробку сплошной кнопки того же
          // размера, что у обведённой. Счёт читаемости назовёт её «посчитать нечем» — и это
          // верный ответ: что лежит под полностью прозрачным, значение не говорит.
          borderColor: "transparent",
        },
        states: {
          hover: { props: { background: "var(--бренд-10)", color: "var(--бренд-contrast)" } },
        },
      },
    },
    тихая: {
      root: {
        props: {
          background: "var(--нейтраль-3)",
          color: "var(--нейтраль-12)",
          borderColor: "var(--нейтраль-7)",
        },
        states: {
          hover: { props: { background: "var(--нейтраль-4)", color: "var(--нейтраль-12)" } },
          active: { props: { background: "var(--нейтраль-5)", color: "var(--нейтраль-12)" } },
        },
      },
    },
    опасная: {
      root: {
        props: {
          background: "var(--опасность-9)",
          color: "var(--опасность-contrast)",
          borderColor: "transparent",
        },
        states: {
          hover: { props: { background: "var(--опасность-10)", color: "var(--опасность-contrast)" } },
        },
      },
    },
  },
  defaultVariant: "главная",
  compoundVariants: [
    {
      // Общее для ДВУХ сплошных вариаций сразу — ровно тот случай, ради которого пересечение и
      // существует: вложением его пришлось бы написать дважды.
      variants: ["главная", "опасная"],
      states: ["active"],
      style: { root: { props: { filter: "brightness(0.94)" } } },
    },
  ],
};

/**
 * ПОВЕРХНОСТЬ. Одна часть, состояний нет, две вариации.
 *
 * Первая ступень — фон приложения, вторая — он же приглушённый: приподнятая поверхность
 * отделяется от страницы именно светлотой, а не тенью. Тень в тёмной половине работает иначе, и
 * из семени она не выводится — это названо перечнем `NOT_SEEDED` у механики.
 */
const поверхность: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "block",
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        background: "var(--нейтраль-1)",
        color: "var(--нейтраль-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-normal)",
      },
    },
  },
  variants: {
    обычная: { root: { props: { background: "var(--нейтраль-1)", color: "var(--нейтраль-12)" } } },
    приподнятая: {
      root: {
        props: {
          background: "var(--нейтраль-2)",
          color: "var(--нейтраль-12)",
          borderWidth: "var(--border-width-1)",
          borderStyle: "solid",
          borderColor: "var(--нейтраль-6)",
        },
      },
    },
  },
  defaultVariant: "обычная",
};

/**
 * ГАРМОШКА. Пять частей и пятнадцать состояний — самый нагруженный рецепт эталона, и он же
 * единственное место, где выражено правило «часть выглядит так, когда её ВЛАДЕЛЕЦ в состоянии».
 *
 * Раскрытый вид содержимого адресуется через предка: свой признак раскрытия у содержимого
 * приезжает не всегда, и паспорт объявляет это прямо. Без адреса по предку такое правило
 * выразить нельзя вовсе — ради этого поле в модели и заведено.
 */
const гармошка: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        borderRadius: "var(--radius-lg)",
        background: "var(--нейтраль-1)",
        color: "var(--нейтраль-12)",
      },
    },
    item: {
      props: {
        display: "flex",
        flexDirection: "column",
        // Заливка названа рядом с рамкой намеренно: счёт читаемости считает ПАРУ, и рамка без
        // названной под ней заливки уезжает у него в «посчитать нечем».
        background: "var(--нейтраль-1)",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--нейтраль-6)",
        overflow: "hidden",
      },
      states: {
        open: { props: { borderColor: "var(--нейтраль-7)" } },
        disabled: { props: { opacity: "0.5" } },
        focus: { props: { borderColor: "var(--бренд-8)" } },
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
        background: "var(--нейтраль-3)",
        color: "var(--нейтраль-12)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        textAlign: "start",
        cursor: "pointer",
        transition: переход,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { background: "var(--нейтраль-4)", color: "var(--нейтраль-12)" } },
        hover: { props: { background: "var(--нейтраль-4)", color: "var(--нейтраль-12)" } },
        active: { props: { background: "var(--нейтраль-5)", color: "var(--нейтраль-12)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--бренд-8)",
            outlineOffset: "calc(var(--border-width-2) * -1)",
          },
        },
        focus: { props: { color: "var(--нейтраль-12)", background: "var(--нейтраль-4)" } },
        disabled: { props: { cursor: "not-allowed", opacity: "0.6" } },
      },
    },
    itemContent: {
      props: {
        paddingInline: "var(--space-4)",
        paddingBlock: "var(--space-3)",
        background: "var(--нейтраль-1)",
        color: "var(--нейтраль-11)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-relaxed)",
      },
      states: {
        // Закрытое содержимое кит показывать не обязан — вид на этот случай всё равно объявлен:
        // состояние объявлено паспортом, значит оно адресуемо, значит эталон его адресует.
        closed: { props: { paddingBlock: "0" } },
        disabled: { props: { color: "var(--нейтраль-11)", background: "var(--нейтраль-2)" } },
        focus: { props: { color: "var(--нейтраль-12)", background: "var(--нейтраль-1)" } },
      },
      ancestors: [
        {
          // Раскрытое содержимое — по состоянию ВЛАДЕЛЬЦА: свой признак у содержимого приезжает
          // не всегда, и паспорт говорит об этом прямо.
          component: "accordion",
          part: "item",
          states: ["open"],
          style: { props: { paddingBlock: "var(--space-3)" } },
        },
      ],
    },
    itemIndicator: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--нейтраль-11)",
        background: "var(--нейтраль-3)",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { transform: "rotate(180deg)" } },
        disabled: { props: { opacity: "0.6" } },
        focus: { props: { color: "var(--нейтраль-12)", background: "var(--нейтраль-3)" } },
      },
    },
  },
};

/**
 * ПОТОК. Раскладка в ряд с переносом: две части, состояний нет, вариаций нет.
 *
 * Раскладка — вид, а не поведение: она меняет то, КАК компонент выглядит, и не меняет того, что
 * он показывает. Поэтому она законна в скине.
 */
const поток: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-3)",
      },
    },
    item: { props: { display: "block", minWidth: "0" } },
  },
};

/**
 * СЕТКА. Колонки от ширины читаемой колонки: две части, состояний нет, вариаций нет.
 *
 * Ширина берётся ступенью колонки, а не числом колонок: число зависит от места, а ступень — от
 * того, сколько знаков в строке остаётся читаемым.
 */
const сетка: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "grid",
        gap: "var(--space-4)",
        gridTemplateColumns: "repeat(auto-fill, minmax(var(--column-32), 1fr))",
      },
    },
    cell: { props: { display: "block", minWidth: "0" } },
  },
};

/** Рецепты эталона: имя компонента (оно же `data-scope`) → рецепт. */
export const рецепты: Readonly<Record<string, SlotRecipe>> = {
  accordion: гармошка,
  button: кнопка,
  flow: поток,
  grid: сетка,
  surface: поверхность,
};
