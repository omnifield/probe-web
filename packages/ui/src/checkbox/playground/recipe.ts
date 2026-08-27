// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`, `PWEB-114`) — не поставка, не вкус продукта. Живёт рядом с
// компонентом, но НИКУДА не экспортируется из `index.ts`/`passport.ts`/`kit.ts` — его читает
// только `checkbox.test.tsx`, доказывая, что паспорт чекбокса МОЖНО одеть целиком настоящей
// механикой скина (`skinGaps` пусто, CSS порождается).

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Переход вида — тот же приём, что у кнопки и гармошки. */
const переход = "background-color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

/**
 * ЧЕКБОКС. Четыре части, одиннадцать состояний.
 *
 * Управляющая рамка несёт границу и фон; указатель — только цвет знака (сам знак кладёт
 * потребитель). Отмеченность и «отчасти» красят рамку сплошным акцентом — обе трактуются как
 * «есть выбор», обычная норма рынка.
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        cursor: "pointer",
      },
      states: {
        disabled: { props: { cursor: "not-allowed", opacity: "0.5" } },
      },
    },
    control: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        width: "var(--control-height-sm)",
        height: "var(--control-height-sm)",
        borderRadius: "var(--radius-sm)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        transition: переход,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { borderColor: "var(--accent-9)", background: "var(--accent-9)" } },
        indeterminate: { props: { borderColor: "var(--accent-9)", background: "var(--accent-9)" } },
        hover: { props: { borderColor: "var(--accent-8)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        invalid: { props: { borderColor: "var(--danger-9)" } },
        disabled: { props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)" } },
      },
    },
    // `display` НЕ В БАЗЕ: кит прячет указатель атрибутом `hidden` (нативный `display: none`),
    // пока чекбокс не отмечен и не «отчасти» — безусловный `display: inline-flex` в базе перебил
    // бы это для КАЖДОГО чекбокса разом, знак был бы виден всегда. Ставим `display` вместе с теми
    // же двумя состояниями, что снимают `hidden`.
    indicator: {
      props: {
        color: "var(--accent-contrast)",
        fontSize: "var(--font-size-sm)",
        lineHeight: "1",
      },
      states: {
        checked: { props: { display: "inline-flex" } },
        indeterminate: { props: { display: "inline-flex" } },
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
  },
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "чекбокс-проба", component: "checkbox", recipe };
