import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), opacity var(--motion-fast) var(--ease-out)";

const navButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minBlockSize: "var(--control-height-md)",
  minInlineSize: "var(--control-height-md)",
  borderWidth: "0",
  borderRadius: "var(--radius-full)",
  background: "var(--neutral-3)",
  color: "var(--neutral-12)",
  fontSize: "var(--font-size-md)",
  cursor: "pointer",
  transition,
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
} as const;

const navButtonStates = {
  hover: { props: { background: "var(--neutral-4)" } },
  active: { props: { background: "var(--neutral-5)" } },
  "focus-visible": {
    props: {
      outline: "var(--border-width-2) solid var(--accent-8)",
      outlineOffset: "var(--border-width-2)",
    },
  },
  disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
} as const;

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { position: "relative", display: "flex", flexDirection: "column", gap: "var(--space-3)" },
    },
    itemGroup: {
      props: {
        position: "relative",
        display: "flex",
        overflow: "hidden",
        borderRadius: "var(--radius-lg)",
      },
      states: { dragging: { props: { cursor: "grabbing" } } },
    },
    item: {
      props: {
        flex: "0 0 100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: "16 / 9",
        background: "var(--neutral-2)",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        opacity: "0.4",
        transition: "opacity var(--motion-normal) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: { inview: { props: { opacity: "1" } } },
    },
    control: {
      props: { display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" },
    },
    prevTrigger: { props: navButton, states: navButtonStates },
    nextTrigger: { props: navButton, states: navButtonStates },
    indicatorGroup: {
      props: { display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" },
    },
    indicator: {
      props: {
        inlineSize: "0.5rem",
        blockSize: "0.5rem",
        padding: "0",
        borderWidth: "0",
        borderRadius: "var(--radius-full)",
        background: "var(--neutral-6)",
        cursor: "pointer",
        transition: "background-color var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        current: { props: { background: "var(--accent-9)" } },
        readonly: { props: { cursor: "default", opacity: "0.6" } },
        hover: { props: { background: "var(--neutral-8)" } },
        active: { props: { transform: "scale(0.85)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
      },
    },
    autoplayTrigger: {
      props: navButton,
      states: {
        hover: navButtonStates.hover,
        active: navButtonStates.active,
        "focus-visible": navButtonStates["focus-visible"],
        pressed: { props: { background: "var(--accent-9)", color: "var(--accent-contrast)" } },
      },
    },
    autoplayIndicator: {
      props: { display: "inline-flex", alignItems: "center", justifyContent: "center" },
    },
    progressText: {
      props: {
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-sm)",
        fontVariantNumeric: "tabular-nums",
      },
    },
  },
  settings: {
    orientation: {
      vertical: {
        itemGroup: { props: { flexDirection: "column" } },
        control: { props: { flexDirection: "column" } },
        indicatorGroup: { props: { flexDirection: "column" } },
      },
    },
  },
};

export const form: Form = { name: "carousel-sample", component: "carousel", recipe };
