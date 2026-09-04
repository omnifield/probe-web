import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    trigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minBlockSize: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "var(--neutral-3)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { background: "var(--neutral-4)" } },
        closed: { props: { background: "var(--neutral-3)" } },
        current: { props: { background: "var(--accent-3)" } },
        hover: { props: { background: "var(--neutral-4)" } },
        active: { props: { background: "var(--neutral-5)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
      },
    },
    backdrop: {
      props: {
        position: "fixed",
        inset: "0",
        background: "oklch(0% 0 0 / 0.4)",
      },
      states: {
        open: { props: { display: "block" } },
        closed: { props: { display: "none" } },
        swiping: { props: { opacity: "var(--drawer-swipe-progress)" } },
      },
    },
    positioner: {
      props: {
        position: "fixed",
        inset: "0",
        display: "flex",
        pointerEvents: "none",
      },
      states: {
        down: { props: { alignItems: "flex-end", justifyContent: "center" } },
        up: { props: { alignItems: "flex-start", justifyContent: "center" } },
        left: { props: { alignItems: "stretch", justifyContent: "flex-start" } },
        right: { props: { alignItems: "stretch", justifyContent: "flex-end" } },
        open: { props: { pointerEvents: "none" } },
        closed: { props: { pointerEvents: "none" } },
      },
    },
    content: {
      props: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        padding: "var(--space-6)",
        background: "var(--neutral-1)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        boxShadow: "0 8px 32px oklch(0% 0 0 / 0.2)",
        pointerEvents: "auto",
        opacity: "1",
        transform: "translate3d(var(--drawer-translate-x, 0px), var(--drawer-translate-y, 0px), 0)",
        transition: "opacity var(--motion-normal) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { opacity: "1" } },
        closed: { props: { opacity: "0" } },
        down: {
          props: {
            width: "100%",
            maxHeight: "90vh",
            borderTopLeftRadius: "var(--radius-lg)",
            borderTopRightRadius: "var(--radius-lg)",
          },
        },
        up: {
          props: {
            width: "100%",
            maxHeight: "90vh",
            borderBottomLeftRadius: "var(--radius-lg)",
            borderBottomRightRadius: "var(--radius-lg)",
          },
        },
        left: {
          props: {
            height: "100%",
            maxWidth: "28rem",
            borderTopRightRadius: "var(--radius-lg)",
            borderBottomRightRadius: "var(--radius-lg)",
          },
        },
        right: {
          props: {
            height: "100%",
            maxWidth: "28rem",
            borderTopLeftRadius: "var(--radius-lg)",
            borderBottomLeftRadius: "var(--radius-lg)",
          },
        },
        swiping: { props: { transition: "none" } },
        dragging: { props: { transition: "none" } },
        expanded: { props: { maxHeight: "100vh" } },
        "nested-drawer-open": { props: { transform: "translate3d(var(--drawer-translate-x, 0px), var(--drawer-translate-y, 0px), 0) scale(0.97)" } },
        "nested-drawer-swiping": { props: { transition: "none" } },
      },
    },
    title: {
      props: {
        fontSize: "var(--font-size-lg)",
        fontWeight: "var(--weight-semibold)",
        color: "var(--neutral-12)",
      },
    },
    description: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-11)",
        lineHeight: "var(--leading-relaxed)",
      },
    },
    grabber: {
      props: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingBlock: "var(--space-2)",
        cursor: "grab",
      },
      states: {
        hover: { props: { opacity: "0.8" } },
        active: { props: { cursor: "grabbing" } },
      },
    },
    grabberIndicator: {
      props: {
        inlineSize: "2.5rem",
        blockSize: "0.25rem",
        borderRadius: "var(--radius-full)",
        background: "var(--neutral-6)",
      },
      ancestors: [
        {
          component: "drawer",
          part: "content",
          states: ["left"],
          style: { props: { inlineSize: "0.25rem", blockSize: "2.5rem" } },
        },
        {
          component: "drawer",
          part: "content",
          states: ["right"],
          style: { props: { inlineSize: "0.25rem", blockSize: "2.5rem" } },
        },
      ],
    },
    closeTrigger: {
      props: {
        position: "absolute",
        top: "var(--space-3)",
        insetInlineEnd: "var(--space-3)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        inlineSize: "1.75rem",
        blockSize: "1.75rem",
        borderWidth: "0",
        borderRadius: "var(--radius-full)",
        background: "transparent",
        color: "var(--neutral-11)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        hover: { props: { background: "var(--neutral-4)", color: "var(--neutral-12)" } },
        active: { props: { background: "var(--neutral-5)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
      },
    },
    swipeArea: {
      props: {
        position: "fixed",
        background: "transparent",
      },
      states: {
        down: { props: { inset: "auto 0 0 0", blockSize: "1.25rem" } },
        up: { props: { inset: "0 0 auto 0", blockSize: "1.25rem" } },
        left: { props: { inset: "0 auto 0 0", inlineSize: "1.25rem" } },
        right: { props: { inset: "0 0 0 auto", inlineSize: "1.25rem" } },
        disabled: { props: { display: "none" } },
        open: { props: { pointerEvents: "none" } },
        closed: { props: { pointerEvents: "auto" } },
        swiping: { props: { background: "transparent" } },
      },
    },
  },
};

export const form: Form = { name: "drawer-sample", component: "drawer", recipe };
