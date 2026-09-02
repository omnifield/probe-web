import { GROW_SHRINK_BLOCK, type Form, type SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition =
  "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

const disabledRow = {
  color: "var(--neutral-11)",
  cursor: "not-allowed",
  opacity: "0.6",
};

const depthIndent = "calc((var(--depth) - 1) * var(--space-6) / 2)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { display: "flex", flexDirection: "column" },
    },
    item: {
      props: {
        display: "flex",
        flexDirection: "column",
        "--active-color": "initial",
        "--active-weight": "initial",
      },
      states: {
        disabled: { props: { pointerEvents: "none" } },
        loading: { props: { pointerEvents: "none" } },
        renaming: { props: { cursor: "text" } },
        focus: { props: { zIndex: "1" } },
        selected: {
          props: {
            // Единственная ступень шкалы, у которой одновременно и цвет бренда, и обещание
            // контраста КАК ТЕКСТА (`STEP_PURPOSE`/`NO_PROMISE`, packages/style) — та же
            // ступень что у листа, что у ветки, различие не в цвете, а в весе ниже.
            "--active-color": "var(--accent-11)",
            "--active-weight": "var(--weight-semibold)",
          },
          states: {
            branch: { props: { "--active-weight": "var(--weight-medium)" } },
          },
        },
        checked: {
          props: { borderInlineStartWidth: "0" },
        },
        indeterminate: {
          props: { borderInlineStartWidth: "0" },
        },
        open: { props: { marginBlockEnd: "var(--space-1)" } },
        closed: { props: { marginBlockEnd: "0" } },

        branch: { props: { display: "flex" } },
      },
    },
    control: {
      props: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-1)",
        minHeight: "var(--control-height-sm)",
        paddingInlineEnd: "var(--space-3)",
        borderRadius: "var(--radius-sm)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        cursor: "pointer",
        userSelect: "none",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        hover: { props: { background: "transparent" } },
        active: { props: { background: "transparent" } },
        selected: { props: { background: "transparent" } },
        checked: { props: { background: "transparent" } },
        indeterminate: { props: { background: "transparent" } },
        focus: { props: { outline: "none" } },
        disabled: { props: disabledRow },
        loading: { props: { cursor: "progress", opacity: "0.7" } },
        renaming: { props: { cursor: "text" } },
        open: { props: { background: "transparent" } },
        closed: { props: { background: "transparent" } },
      },
      ancestors: [
        {
          component: "tree-view",
          part: "item",
          style: {
            props: {
              paddingInlineStart: depthIndent,
              color: "var(--active-color, var(--neutral-12))",
              fontWeight: "var(--active-weight, var(--weight-medium))",
            },
          },
        },
      ],
    },
    controlIndicator: {
      props: {
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-sm)",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        // Лист не носит `data-state` вовсе (только ветка) — эти два правила физически не
        // применяются к листу. У листа же `hidden` стоит нативно, если узел НЕ выбран (родное
        // поведение Ark для чекмарки, которое здесь просто не трогаем) — раз иконка на листе не
        // нужна вообще, лишний `display` в состоянии `selected` только включал её обратно.
        open: { props: { display: "inline-flex", transform: "rotate(90deg)" } },
        closed: {
          props: { display: "inline-flex", transform: "rotate(0deg)" },
        },
        selected: {
          props: { color: "var(--accent-11)" },
        },
        disabled: { props: { opacity: "0.6" } },
        loading: { props: { opacity: "0.6" } },
        focus: { props: { color: "var(--neutral-12)" } },
      },
    },
    content: {
      // `overflow`+`boxSizing` — то же устройство, что у аккордеона: без них раскрытие/сжатие по
      // измеренной `--height` (сценарий `GROW_SHRINK_BLOCK`) не отсекало бы содержимое на
      // промежуточных кадрах.
      props: { position: "relative", overflow: "hidden", boxSizing: "border-box" },
      states: {
        open: {
          props: {
            animation: "grow-block-size var(--motion-normal) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
        closed: {
          props: {
            animation: "shrink-block-size var(--motion-normal) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
      },
    },
  },
};

export const form: Form = {
  name: "tree-view-sample",
  component: "tree-view",
  recipe,
  keyframes: { ...GROW_SHRINK_BLOCK },
};
