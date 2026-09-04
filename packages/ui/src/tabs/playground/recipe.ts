import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "color var(--motion-fast) var(--ease-out), background-color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";
const slide = "left var(--motion-normal) var(--ease-out), top var(--motion-normal) var(--ease-out), width var(--motion-normal) var(--ease-out), height var(--motion-normal) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { display: "flex", flexDirection: "column", gap: "var(--space-3)" },
      states: { focus: { props: { outline: "none" } } },
    },
    list: {
      props: {
        display: "flex",
        flexDirection: "row",
        position: "relative",
        gap: "var(--space-1)",
        borderBlockEnd: "var(--border-width-1) solid var(--neutral-6)",
      },
      states: { focus: { props: { outline: "none" } } },
    },
    trigger: {
      props: {
        position: "relative",
        zIndex: "1",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "transparent",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        selected: { props: { color: "var(--neutral-12)" } },
        hover: { props: { color: "var(--neutral-12)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "calc(var(--border-width-2) * -1)",
          },
        },
        active: { props: { color: "var(--neutral-12)" } },
        disabled: { props: { opacity: "0.6", cursor: "not-allowed" } },
        focus: { props: { zIndex: "2" } },
      },
    },
    content: {
      props: {
        paddingBlock: "var(--space-4)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-relaxed)",
      },
      states: { selected: { props: { display: "block" } } },
    },
    indicator: {
      props: {
        position: "absolute",
        zIndex: "0",
        left: "var(--left)",
        width: "var(--width)",
        height: "var(--border-width-2)",
        top: "calc(var(--top) + var(--height) - var(--border-width-2))",
        background: "var(--accent-9)",
        borderRadius: "var(--radius-full)",
        transition: slide,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
    },
  },
  variants: {
    line: {},

    enclosed: {
      list: { props: { borderBlockEnd: "var(--border-width-1) solid var(--neutral-6)", gap: "var(--space-1)" } },
      trigger: {
        props: {
          borderWidth: "var(--border-width-1)",
          borderStyle: "solid",
          borderColor: "transparent",
          borderEndStartRadius: "0",
          borderEndEndRadius: "0",
          background: "var(--neutral-2)",
          marginBlockEnd: "calc(var(--border-width-1) * -1)",
        },
        states: {
          selected: {
            props: {
              background: "var(--neutral-1)",
              borderColor: "var(--neutral-6)",
              borderBlockEndColor: "var(--neutral-1)",
            },
          },
          hover: { props: { background: "var(--neutral-3)" } },
        },
      },
      indicator: { props: { display: "none" } },
    },

    pills: {
      list: {
        props: {
          borderBlockEnd: "none",
          background: "var(--neutral-3)",
          padding: "var(--space-1)",
          borderRadius: "var(--radius-lg)",
        },
      },
      trigger: {
        props: { borderRadius: "var(--radius-md)" },
        states: { selected: { props: { color: "var(--accent-contrast)" } } },
      },
      indicator: {
        props: {
          display: "block",
          left: "var(--left)",
          top: "var(--top)",
          width: "var(--width)",
          height: "var(--height)",
          background: "var(--accent-9)",
          borderRadius: "var(--radius-md)",
        },
      },
    },
  },
  defaultVariant: "line",
  settings: {
    orientation: {
      vertical: {
        root: { props: { flexDirection: "row" } },
        list: {
          props: {
            flexDirection: "column",
            borderBlockEnd: "none",
            borderInlineEnd: "var(--border-width-1) solid var(--neutral-6)",
          },
        },
        indicator: {
          props: {
            left: "0",
            width: "var(--border-width-2)",
            top: "var(--top)",
            height: "var(--height)",
          },
        },
      },
    },
  },
};

export const form: Form = { name: "tabs-sample", component: "tabs", recipe };
