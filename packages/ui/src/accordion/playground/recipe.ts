import { GROW_SHRINK_BLOCK, GROW_SHRINK_INLINE, type Form, type SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

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
    control: {
      props: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-sm)",
        paddingInline: "var(--space-3)",
        borderWidth: "0",
        background: "var(--neutral-3)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        textAlign: "start",
        cursor: "pointer",
        transition,
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
    controlIndicator: {
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
    content: {
      // Анатомия (`README.md`): content не несёт своих визуальных стилей — ни падинга, ни
      // цвета, ни размера. Их определяет то, что ложится внутрь. Здесь только механика
      // контейнера под keyframe-анимацию высоты.
      props: {
        overflow: "hidden",
        boxSizing: "border-box",
      },
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
  settings: {
    orientation: {
      horizontal: {
        root: { props: { flexDirection: "row" } },
        item: { props: { flexDirection: "row" } },
        content: {
          states: {
            open: {
              props: {
                animation: "grow-inline-size var(--motion-normal) var(--ease-out)",
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              },
            },
            closed: {
              props: {
                animation: "shrink-inline-size var(--motion-normal) var(--ease-out)",
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              },
            },
          },
        },
      },
    },
  },
};

export const form: Form = {
  name: "accordion-sample",
  component: "accordion",
  recipe,
  keyframes: { ...GROW_SHRINK_BLOCK, ...GROW_SHRINK_INLINE },
};
