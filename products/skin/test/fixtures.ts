// МАТЕРИАЛ ПРОБ — три записи вида: палитра, форма, наряд.
//
// ## Почему они здесь, если содержимого в коде зоны нет
//
// Содержимого нет в ПОСТАВКЕ и в источнике: витрина не читает встроенного, запасного перечня у
// неё не существует. Пробам же нужно что-то класть в подставную службу — иначе шов с ней
// проверять не на чем.
//
// Разница держится машиной: файл лежит в `test/`, его не видит ни один модуль зоны, а проба
// требует, чтобы в `src/` записей вида не было вовсе.
//
// ## Фикстура нарочно бедная
//
// Одна шкала на роль, один компонент, две вариации. Богатая проверяла бы саму себя: чем больше в
// ней написано, тем больше шансов, что проба зелёная из-за её содержимого, а не из-за работы
// механики. Всё, что нужно пробам, — чтобы записи были ЗАКОННЫМИ и собирались.

import type { Form, Outfit, Palette } from "@omnifield/probe-web-skin/model";

/** Ряды без семени: их не построишь — они называются целиком. */
const РЯДЫ = {
  "leading-none": "1",
  "leading-tight": "1.2",
  "leading-snug": "1.35",
  "leading-normal": "1.5",
  "leading-relaxed": "1.7",
  "weight-normal": "400",
  "weight-medium": "500",
  "weight-semibold": "600",
  "weight-bold": "700",
  "motion-instant": "75ms",
  "motion-fast": "150ms",
  "motion-normal": "250ms",
  "motion-slow": "400ms",
  "ease-linear": "linear",
  "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
};

/** Законная палитра — словарь закрыт целиком. */
export const PALETTE: Palette = {
  name: "проба-палитра",
  scales: {
    accent: "#3457d5",
    neutral: "#6b7280",
    danger: "#d13438",
    success: "#197a3d",
    warning: "#a35a06",
  },
  dimensions: {
    radius: "12px",
    space: "0.5rem",
    "font-size": "1rem",
    column: "1rem",
    "control-height": "2.5rem",
    "border-width": "1px",
    tracking: "0em",
    density: "1",
  },
  light: РЯДЫ,
};

/** Законная форма кнопки — ни одного значения, только ссылки на роли. */
export const FORM: Form = {
  name: "проба-кнопка",
  component: "button",
  recipe: {
    base: {
      root: {
        props: {
          background: "var(--neutral-1)",
          color: "var(--neutral-12)",
          borderRadius: "var(--radius-md)",
        },
        states: {
          hover: { props: { background: "var(--neutral-3)" } },
          disabled: { props: { opacity: 0.5 } },
        },
      },
    },
    variants: {
      главная: {
        root: { props: { background: "var(--accent-9)", color: "var(--accent-contrast)" } },
      },
      тихая: { root: { props: { background: "var(--neutral-2)" } } },
    },
    defaultVariant: "главная",
  },
};

/** Наряд — ссылки на части. */
export const OUTFIT: Outfit = {
  name: "проба",
  palette: PALETTE.name,
  forms: [FORM.name],
};
