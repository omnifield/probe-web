// ТРИ ЗАПИСИ ДЛЯ ПРОБ — палитра, формы, наряд.
//
// Это ПРОБА, а не одежда: значения подобраны так, чтобы каждое требование гейта имело чем
// проверяться. Настоящего эталонного скина зона больше не держит — `packages/skin-reference`
// снесён (`PWEB-110`): форма паспорта переехала сюда физически, и второй кит для гейта живого
// совпадения стало негде взять. Разбор — README, раздел про переезд.

import type { Form, LookParts, Outfit, Palette } from "../src/model.js";

/** Ряды без семени: имена приходят из словаря, значения — дело палитры. */
const РЯДЫ: Readonly<Record<string, string>> = {
  "leading-none": "1",
  "leading-tight": "1.25",
  "leading-snug": "1.375",
  "leading-normal": "1.5",
  "leading-relaxed": "1.625",
  "weight-normal": "400",
  "weight-medium": "500",
  "weight-semibold": "600",
  "weight-bold": "700",
  "motion-instant": "75ms",
  "motion-fast": "200ms",
  "motion-normal": "320ms",
  "motion-slow": "400ms",
  "ease-linear": "linear",
  "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
};

/** Размерные семена: восемь, и плотность среди них обязательна. */
const РАЗМЕРЫ: Readonly<Record<string, string>> = {
  density: "1",
  radius: "0.5rem",
  space: "0.25rem",
  "font-size": "1rem",
  column: "0.5rem",
  "control-height": "2.5rem",
  "border-width": "1px",
  tracking: "0em",
};

/** ПОЛНАЯ палитра: закрывает словарь целиком — все пять намерений. */
export const синяя: Palette = {
  name: "синяя",
  scales: {
    accent: "oklch(0.55 0.18 255)",
    neutral: "oklch(0.55 0.02 255)",
    danger: "oklch(0.55 0.2 25)",
    success: "oklch(0.55 0.15 145)",
    warning: "oklch(0.7 0.15 75)",
  },
  dimensions: РАЗМЕРЫ,
  light: РЯДЫ,
};

/** Та же палитра, ПЕРЕСЕЯННАЯ: другое семя акцента, остальное то же. */
export const зелёная: Palette = { ...синяя, name: "зелёная", scales: { ...синяя.scales, accent: "oklch(0.55 0.2 140)" } };

/**
 * ПОЛНАЯ, но ПЛОХАЯ палитра: словарь закрыт, а контрастная ступень акцента задана литералом,
 * совпадающим со сплошной. Форма, написанная под хорошую палитру, на этой становится нечитаемой —
 * ровно то, ради чего сборка и объявлена шагом с отчётом.
 */
export const слепая: Palette = {
  ...синяя,
  name: "слепая",
  light: { ...РЯДЫ, "accent-contrast": "oklch(0.55 0.18 255)" },
};

/** Палитра, НЕ ЗАКРЫВШАЯ словарь: рядов нет вовсе. */
export const неполная: Palette = { name: "неполная", scales: синяя.scales, dimensions: РАЗМЕРЫ };

/**
 * Палитра ПОД ТРИ ШКАЛЫ — ровно та, что была законной до `PWEB-79`.
 *
 * Ломающее названо материалом, а не абзацем: словарь вырос, и палитра, писавшаяся под прежний,
 * перестала его закрывать. Отвергается ДО надевания — это и есть работающая неполнота.
 */
export const трёхшкальная: Palette = {
  ...синяя,
  name: "трёхшкальная",
  scales: {
    accent: "oklch(0.55 0.18 255)",
    neutral: "oklch(0.55 0.02 255)",
    danger: "oklch(0.55 0.2 25)",
  },
};

/** Форма кнопки: адресует роли, а не значения. */
export const кнопка: Form = {
  name: "кнопка-строгая",
  component: "button",
  recipe: {
    base: {
      root: {
        props: {
          background: "var(--accent-9)",
          color: "var(--accent-contrast)",
          borderRadius: "var(--radius-md)",
          paddingInline: "var(--space-4)",
          fontWeight: "var(--weight-medium)",
        },
      },
    },
  },
};

/** Форма поверхности: второй компонент, нужен пробе про ГРАНИЦЫ точечной правки. */
export const поверхность: Form = {
  name: "поверхность-простая",
  component: "surface",
  recipe: {
    base: {
      root: {
        props: {
          background: "var(--neutral-1)",
          color: "var(--neutral-12)",
          borderRadius: "var(--radius-md)",
        },
      },
    },
  },
};

/** Вторая форма НА ТОТ ЖЕ компонент: наряд, назвавший обе, невалиден. */
export const кнопкаПлоская: Form = { ...кнопка, name: "кнопка-плоская" };

/** Форма, просящая роль ВНЕ словаря. */
export const кнопкаЧужая: Form = {
  name: "кнопка-чужая",
  component: "button",
  recipe: { base: { root: { props: { background: "var(--фирменный-градиент)" } } } },
};

/** Форма, написавшая значение СВОИМ литералом: она бьёт палитру на этом свойстве. */
export const кнопкаСвоя: Form = {
  name: "кнопка-своя",
  component: "button",
  recipe: {
    base: {
      root: { props: { background: "var(--accent-9)", borderRadius: "0px" } },
    },
  },
};

/**
 * Форма на компонент, паспорта у которого НЕТ ВОВСЕ (`PWEB-95`).
 *
 * Просит переменную части — ту, законность которой без паспорта не прочитать. До `PWEB-95` такая
 * форма краснела пачкой `outside-vocabulary`, по одному изъяну на имя: следствие вместо причины.
 */
export const нездешняя: Form = {
  name: "нездешняя",
  component: "нездешний",
  recipe: {
    base: {
      root: { props: { height: "var(--height)", background: "var(--фирменный-градиент)" } },
    },
  },
};

/**
 * Форма с ИМЕНОВАННЫМ ДВИЖЕНИЕМ, применённым на своей части (`PWEB-101`).
 *
 * Материал живой и он же спорный: `--height` объявляет паспорт на содержимом гармошки, кит кладёт
 * её туда же, а раскрытие пишет скин — движением по тому же узлу. Ступень кадра разрешается на
 * анимируемом элементе, значит законность имени принадлежит части, где стоит `animation:`.
 */
export const гармошкаДвижением: Form = {
  name: "гармошка-движением",
  component: "accordion",
  recipe: {
    base: {
      itemContent: {
        props: { overflow: "hidden" },
        states: {
          open: { props: { animation: "раскрытие var(--motion-normal) var(--ease-out)" } },
        },
      },
    },
  },
  keyframes: {
    раскрытие: { from: { height: "0" }, to: { height: "var(--height)" } },
  },
};

/** Та же форма, применившая движение НЕ НА ТОЙ части: переменной там никто не ставит. */
export const гармошкаНеТам: Form = {
  ...гармошкаДвижением,
  name: "гармошка-не-там",
  recipe: {
    base: {
      itemTrigger: { props: { animation: "раскрытие var(--motion-normal) var(--ease-out)" } },
    },
  },
};

/**
 * Та же форма, движение которой применено ПОД НАСТРОЙКОЙ, а не в базе (`PWEB-105`).
 *
 * Материал ЖИВОЙ и он же тот, на котором пробел нашёлся: `settings` приехал в рецепт после
 * `formRefs`/`motionParts` (`PWEB-101` предшествует `PWEB-103`), и обе функции продолжали
 * обходить старые три группы — база, вариации, пересечения, — молча пропуская четвёртую. Запись
 * под настройкой была НЕПРОВЕРЕННОЙ до сборки: `assemble` отказывал по причине «переменную не
 * ставят», хотя на порождённом правиле переменная стояла ровно на своей части.
 */
export const гармошкаДвижениемВНастройке: Form = {
  ...гармошкаДвижением,
  name: "гармошка-движением-в-настройке",
  recipe: {
    settings: {
      orientation: {
        horizontal: {
          itemContent: {
            props: { overflow: "hidden" },
            states: {
              open: { props: { animation: "раскрытие var(--motion-normal) var(--ease-out)" } },
            },
          },
        },
      },
    },
  },
};

/**
 * Форма, просящая роль ВНЕ словаря — ПОД НАСТРОЙКОЙ, а не в базе (`PWEB-105`).
 *
 * Вторая половина того же пробела: `formRefs` проверяет не только движение, но и обычные ссылки
 * на роли, и до правки настройка была слепой зоной для обоих вопросов сразу.
 */
export const гармошкаЧужаяВНастройке: Form = {
  name: "гармошка-чужая-в-настройке",
  component: "accordion",
  recipe: {
    settings: {
      orientation: {
        horizontal: { root: { props: { background: "var(--фирменный-градиент)" } } },
      },
    },
  },
};

/** Наряд: палитра именем, две формы, одна точечная правка. */
export const наряд: Outfit = {
  name: "проба",
  palette: "синяя",
  forms: ["кнопка-строгая", "поверхность-простая"],
  overrides: { button: { "radius-md": "0px" } },
};

/** Части, из которых собираются пробные наряды: ровно то, что отдаст хранилище. */
export const части: LookParts = {
  palettes: [синяя, зелёная, неполная, слепая, трёхшкальная],
  forms: [
    кнопка,
    поверхность,
    кнопкаПлоская,
    кнопкаЧужая,
    кнопкаСвоя,
    нездешняя,
    гармошкаДвижением,
    гармошкаНеТам,
    гармошкаДвижениемВНастройке,
    гармошкаЧужаяВНастройке,
  ],
};
