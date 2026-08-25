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
        borderColor: "var(--нейтраль-7)",
        background: "var(--нейтраль-1)",
        transition: переход,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { borderColor: "var(--акцент-9)", background: "var(--акцент-9)" } },
        indeterminate: { props: { borderColor: "var(--акцент-9)", background: "var(--акцент-9)" } },
        hover: { props: { borderColor: "var(--акцент-8)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--акцент-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        invalid: { props: { borderColor: "var(--опасность-9)" } },
        disabled: { props: { borderColor: "var(--нейтраль-6)", background: "var(--нейтраль-3)" } },
      },
    },
    indicator: {
      props: {
        display: "inline-flex",
        color: "var(--акцент-contrast)",
        fontSize: "var(--font-size-sm)",
        lineHeight: "1",
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--нейтраль-12)",
      },
      states: {
        disabled: { props: { color: "var(--нейтраль-11)" } },
      },
    },
  },
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "чекбокс-проба", component: "checkbox", recipe };
