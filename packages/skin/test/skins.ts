// СКИН ДЛЯ ПРОБ — кнопка, одетая целиком.
//
// Это ПРОБА, а не одежда. Содержимое скина — предмет зоны `products/skin`, и сюда оно не едет:
// здесь механика, и скин нужен ей ровно как вход, на котором проверяется порождение. Значения
// подобраны так, чтобы каждое требование гейта имело чем проверяться, а не чтобы кнопка была
// красивой.
//
// Обкатка идёт на кнопке (страница «Скин», раздел «Обкатка»): остальные компоненты одеваются
// волной разноса, по одному.

import type { SketchEdit, Skin } from "../src/model.js";

/** Имена значений, которые проба объявляет известными: словарь приходит снаружи. */
export const VOCABULARY = ["radius-md", "brand-9", "brand-10", "danger-9", "space-3"];

/** Кнопка: база, три вариации, умолчание, состояния и пересечение. */
export const buttonSkin: Skin = {
  name: "проба",
  variables: {
    light: { "skin-ink": "oklch(0.2 0 0)", "skin-ring": "oklch(0.6 0.1 250)" },
    dark: { "skin-ink": "oklch(0.98 0 0)", "skin-ring": "oklch(0.7 0.1 250)" },
  },
  keyframes: {
    пульс: { from: { opacity: "1" }, to: { opacity: "0.4" } },
  },
  recipes: {
    button: {
      base: {
        root: {
          props: {
            display: "inline-flex",
            alignItems: "center",
            paddingInline: "var(--space-3)",
            borderRadius: "var(--radius-md)",
            color: "var(--skin-ink)",
            // Литерал, а не ссылка: пробы каскада сравнивают ВЫЧИСЛЕННЫЙ цвет, а `var()` в
            // jsdom не разрешается — сравнивать было бы нечего.
            backgroundColor: "rgb(7, 7, 7)",
          },
          states: {
            hover: { props: { opacity: "0.9" } },
            "focus-visible": { props: { outline: "2px solid var(--skin-ring)" } },
            disabled: {
              props: { opacity: "0.4" },
              // Пересечение состояний вложением: у отключённой кнопки наведения быть не должно.
              states: { hover: { props: { opacity: "0.4" } } },
            },
            busy: { props: { animation: "пульс 1s infinite" } },
          },
        },
      },
      variants: {
        главная: { root: { props: { backgroundColor: "rgb(1, 2, 3)" } } },
        тихая: { root: { props: { backgroundColor: "transparent" } } },
        опасная: { root: { props: { backgroundColor: "var(--danger-9)" } } },
      },
      defaultVariant: "главная",
      compoundVariants: [
        {
          variants: ["главная", "опасная"],
          states: ["hover"],
          style: { root: { props: { filter: "brightness(1.1)" } } },
        },
      ],
    },
  },
};

/**
 * Скин, у которого вложено ВСЁ, что вложением разрешено: псевдоэлементы, три вида at-правил и
 * псевдоэлемент внутри at-правила.
 *
 * Существует ради одного — снимка вывода. Разворот вложенного делает чужое средство, и заметить
 * его смену можно только на входе, который это средство по-настоящему нагружает.
 */
export const nestedSkin: Skin = {
  name: "эталон",
  variables: { light: { a: "1" }, dark: { a: "2" } },
  keyframes: { пульс: { from: { opacity: "1" }, to: { opacity: "0.4" } } },
  recipes: {
    button: {
      base: {
        root: {
          props: {
            display: "inline-flex",
            paddingInline: "var(--space-3)",
            "&::before": { content: '""', display: "block" },
            "&::after": { content: '"↦"' },
            "@media (min-width: 40rem)": {
              paddingInline: "2rem",
              "&::before": { content: '"широко"' },
            },
            "@supports (color: oklch(0 0 0))": { color: "oklch(0.2 0 0)" },
            "@container (min-width: 20rem)": { gap: "1rem" },
          },
          states: {
            hover: { props: { opacity: "0.9", "&::before": { opacity: "1" } } },
            disabled: {
              props: { opacity: "0.4" },
              states: { hover: { props: { opacity: "0.4" } } },
            },
          },
        },
      },
      variants: {
        главная: { root: { props: { background: "rgb(1, 2, 3)" } } },
        тихая: { root: { props: { background: "transparent" } } },
      },
      defaultVariant: "главная",
      compoundVariants: [
        {
          variants: ["главная", "тихая"],
          states: ["hover"],
          style: { root: { props: { filter: "brightness(1.1)" } } },
        },
      ],
    },
  },
};

/** Правки образца к тому же эталону — вторая область адреса, тоже со вложенным. */
export const nestedEdits: readonly SketchEdit[] = [
  {
    node: "btn-1",
    component: "button",
    part: "root",
    style: {
      props: { background: "red", "&::before": { content: '"!"' } },
      states: { hover: { props: { background: "darkred" } } },
    },
  },
];

/**
 * Кнопка, одетая ЦЕЛИКОМ: часть и все семь объявленных состояний.
 *
 * Нужен покрытию: «пусто» проверяется только на скине, которому по-настоящему нечего добрать.
 * Состояния перечислены руками, а не выведены из паспорта: выведи их проба из того же источника,
 * из которого их читает механика, — и она перестала бы замечать, что одно из них потерялось.
 */
export const dressedSkin: Skin = {
  name: "одета",
  recipes: {
    button: {
      base: {
        root: {
          props: { display: "inline-flex" },
          states: {
            hover: { props: { opacity: "0.9" } },
            "focus-visible": { props: { outline: "2px solid" } },
            active: { props: { transform: "translateY(1px)" } },
            disabled: { props: { opacity: "0.4" } },
            busy: { props: { cursor: "progress" } },
            expanded: { props: { borderBottomColor: "transparent" } },
            pressed: { props: { fontWeight: "700" } },
          },
        },
      },
    },
  },
};
