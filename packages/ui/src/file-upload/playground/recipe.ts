import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

const buttonStates = {
  hover: { props: { background: "var(--neutral-4)" } },
  active: { props: { background: "var(--neutral-5)" } },
  "focus-visible": {
    props: {
      outline: "var(--border-width-2) solid var(--accent-8)",
      outlineOffset: "var(--border-width-2)",
    },
  },
  readonly: { props: { cursor: "default" } },
  disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
} as const;

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { display: "flex", flexDirection: "column", gap: "var(--space-2)" },
      states: {
        disabled: { props: { opacity: "0.6" } },
        readonly: { props: { opacity: "1" } },
        dragging: { props: { cursor: "copy" } },
      },
    },
    label: {
      props: { fontSize: "var(--font-size-md)", fontWeight: "var(--weight-medium)", color: "var(--neutral-12)" },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
        required: { props: { fontWeight: "var(--weight-semibold)" } },
      },
    },
    dropzone: {
      props: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        padding: "var(--space-6)",
        borderWidth: "var(--border-width-2)",
        borderStyle: "dashed",
        borderColor: "var(--neutral-6)",
        borderRadius: "var(--radius-lg)",
        background: "var(--neutral-1)",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        dragging: { props: { borderColor: "var(--accent-8)", background: "var(--accent-2)" } },
        invalid: { props: { borderColor: "var(--danger-9)" } },
        readonly: { props: { background: "var(--neutral-2)" } },
        disabled: { props: { cursor: "not-allowed" } },
      },
    },
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
      states: { ...buttonStates, invalid: { props: { borderWidth: "var(--border-width-1)", borderStyle: "solid", borderColor: "var(--danger-9)" } } },
    },
    clearTrigger: {
      props: {
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        paddingInline: "var(--space-2)",
        paddingBlock: "var(--space-1)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "transparent",
        color: "var(--danger-11)",
        fontSize: "var(--font-size-sm)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        hover: { props: { background: "var(--danger-3)" } },
        active: { props: { background: "var(--danger-4)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
        readonly: { props: { cursor: "default" } },
        disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
      },
    },
    itemGroup: {
      props: { display: "flex", flexDirection: "column", gap: "var(--space-1)" },
      states: {
        disabled: { props: { opacity: "0.6" } },
        accepted: { props: { gap: "var(--space-1)" } },
        rejected: { props: { gap: "var(--space-1)" } },
      },
    },
    item: {
      props: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-2)",
        borderRadius: "var(--radius-md)",
        background: "var(--neutral-2)",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
        accepted: { props: { background: "var(--neutral-2)" } },
        rejected: {
          props: {
            background: "var(--danger-2)",
            borderWidth: "var(--border-width-1)",
            borderStyle: "solid",
            borderColor: "var(--danger-6)",
          },
        },
      },
    },
    itemPreview: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        inlineSize: "2rem",
        blockSize: "2rem",
        fontSize: "var(--font-size-md)",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
        accepted: { props: { opacity: "1" } },
        rejected: { props: { filter: "grayscale(1)" } },
      },
    },
    itemPreviewImage: {
      props: {
        inlineSize: "2rem",
        blockSize: "2rem",
        objectFit: "cover",
        borderRadius: "var(--radius-sm)",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
        accepted: { props: { opacity: "1" } },
        rejected: { props: { filter: "grayscale(1)" } },
      },
    },
    itemName: {
      props: {
        flex: "1",
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
        accepted: { props: { color: "var(--neutral-12)" } },
        rejected: { props: { color: "var(--danger-11)" } },
      },
    },
    itemSizeText: {
      props: { fontSize: "var(--font-size-sm)", color: "var(--neutral-11)" },
      states: {
        disabled: { props: { opacity: "0.7" } },
        accepted: { props: { color: "var(--neutral-11)" } },
        rejected: { props: { color: "var(--danger-11)" } },
      },
    },
    itemDeleteTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        inlineSize: "1.5rem",
        blockSize: "1.5rem",
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
        readonly: { props: { cursor: "default" } },
        disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
        accepted: { props: { color: "var(--neutral-11)" } },
        rejected: { props: { color: "var(--danger-11)" } },
      },
    },
  },
};

export const form: Form = { name: "file-upload-sample", component: "file-upload", recipe };
