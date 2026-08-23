// ТРИ ЗАПИСИ ДЛЯ ПРОБ — палитра, формы, наряд.
//
// Это ПРОБА, а не одежда: значения подобраны так, чтобы каждое требование гейта имело чем
// проверяться. Настоящий вид живёт в эталонном скине (`packages/skin-reference`), и сюда он не
// едет — здесь механика.

import type { Form, Outfit, Palette } from "../src/model.js";

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

/** ПОЛНАЯ палитра: закрывает словарь целиком. */
export const синяя: Palette = {
  name: "синяя",
  scales: {
    акцент: "oklch(0.55 0.18 255)",
    нейтраль: "oklch(0.55 0.02 255)",
    опасность: "oklch(0.55 0.2 25)",
  },
  dimensions: РАЗМЕРЫ,
  light: РЯДЫ,
};

/** Та же палитра, ПЕРЕСЕЯННАЯ: другое семя акцента, остальное то же. */
export const зелёная: Palette = { ...синяя, name: "зелёная", scales: { ...синяя.scales, акцент: "oklch(0.55 0.2 140)" } };

/**
 * ПОЛНАЯ, но ПЛОХАЯ палитра: словарь закрыт, а контрастная ступень акцента задана литералом,
 * совпадающим со сплошной. Форма, написанная под хорошую палитру, на этой становится нечитаемой —
 * ровно то, ради чего сборка и объявлена шагом с отчётом.
 */
export const слепая: Palette = {
  ...синяя,
  name: "слепая",
  light: { ...РЯДЫ, "акцент-contrast": "oklch(0.55 0.18 255)" },
};

/** Палитра, НЕ ЗАКРЫВШАЯ словарь: рядов нет вовсе. */
export const неполная: Palette = { name: "неполная", scales: синяя.scales, dimensions: РАЗМЕРЫ };

/** Форма кнопки: адресует роли, а не значения. */
export const кнопка: Form = {
  name: "кнопка-строгая",
  component: "button",
  recipe: {
    base: {
      root: {
        props: {
          background: "var(--акцент-9)",
          color: "var(--акцент-contrast)",
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
          background: "var(--нейтраль-1)",
          color: "var(--нейтраль-12)",
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
      root: { props: { background: "var(--акцент-9)", borderRadius: "0px" } },
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
