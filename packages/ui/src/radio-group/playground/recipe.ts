import type { Form, SlotRecipe } from "@web-core/skin/model";

const ringTransition = "background-color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";
const dotTransition = "left var(--motion-normal) var(--ease-out), top var(--motion-normal) var(--ease-out)";
const dotSize = "0.5rem";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      },
      states: {
        disabled: { props: { opacity: "0.5" } },
        invalid: { props: { opacity: "1" } },
        required: { props: { opacity: "1" } },
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
        invalid: { props: { color: "var(--danger-11)" } },
        required: { props: { fontWeight: "var(--weight-medium)" } },
      },
    },
    item: {
      props: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        cursor: "pointer",
      },
      states: {
        checked: { props: { cursor: "pointer" } },
        unchecked: { props: { cursor: "pointer" } },
        disabled: { props: { cursor: "not-allowed" } },
        readonly: { props: { cursor: "default" } },
        invalid: { props: { cursor: "pointer" } },
        hover: { props: { cursor: "pointer" } },
        focus: { props: { outline: "none" } },
        "focus-visible": { props: { outline: "none" } },
      },
    },
    itemText: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
      states: {
        checked: { props: { fontWeight: "var(--weight-medium)" } },
        unchecked: { props: { fontWeight: "var(--weight-normal)" } },
        disabled: { props: { color: "var(--neutral-11)" } },
        readonly: { props: { color: "var(--neutral-12)" } },
        invalid: { props: { color: "var(--danger-11)" } },
        hover: { props: { textDecoration: "underline" } },
        focus: { props: { outline: "none" } },
        "focus-visible": { props: { textDecoration: "underline" } },
      },
    },
    itemControl: {
      props: {
        display: "inline-flex",
        boxSizing: "border-box",
        flexShrink: "0",
        width: "var(--control-height-sm)",
        height: "var(--control-height-sm)",
        borderRadius: "var(--radius-full)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        transition: ringTransition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { borderColor: "var(--accent-9)" } },
        unchecked: { props: { borderColor: "var(--neutral-7)" } },
        hover: { props: { borderColor: "var(--accent-8)" } },
        active: { props: { transform: "scale(0.92)" } },
        focus: { props: { outline: "none" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        invalid: { props: { borderColor: "var(--danger-9)" } },
        disabled: { props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)" } },
        readonly: { props: { cursor: "default" } },
      },
    },
    indicator: {
      props: {
        // Zag меряет `--left`/`--top`/`--width`/`--height` по ВСЕМУ `item` (кружок+подпись —
        // `getRectById` в @zag-js/radio-group меряет узел `item`, не `itemControl`), а для оси,
        // которая едет между пунктами (`top` в vertical, `left` в horizontal), сам же прописывает
        // инлайном сырой `var(--top)`/`var(--left)` без центрирования — инлайн-стиль перебивает
        // любое наше правило по той же оси через класс/атрибут-селектор, так что центрирование
        // нельзя класть в `left`/`top` напрямую. `left`/`top` здесь — те же сырые значения (для
        // "свободной" оси это единственный работающий способ её позиционировать, для "занятой"
        // Zag'ом — то же самое значение, что и так возьмёт инлайн, поэтому конфликта нет), а
        // центровка внутрь кружка (control — первый flex-child `item`, по вертикали всегда
        // отцентрован через `align-items:center`) — отдельным `transform`, который Zag не трогает
        // вообще ни для одной оси.
        position: "absolute",
        left: "var(--left)",
        top: "var(--top)",
        width: dotSize,
        height: dotSize,
        transform:
          "translate(calc((var(--control-height-sm) - " + dotSize + ") / 2), calc((var(--height) - " + dotSize + ") / 2))",
        borderRadius: "var(--radius-full)",
        background: "var(--accent-9)",
        pointerEvents: "none",
        transition: dotTransition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        disabled: { props: { background: "var(--neutral-6)" } },
      },
    },
  },
  settings: {
    orientation: {
      horizontal: {
        root: { props: { flexDirection: "row" } },
      },
    },
  },
};

export const form: Form = { name: "radio-group-sample", component: "radio-group", recipe };
