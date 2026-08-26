// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only
// `button.test.tsx` reads it, to prove the button's passport CAN be dressed whole by the real
// skin mechanism. This used to be proven by a separate package, `packages/skin-reference`
// (removed, `PWEB-110`).
//
// Ported line-for-line from `packages/skin-reference/src/recipes.ts` (git history is intact at
// `git show 5d560ae:packages/skin-reference/src/recipes.ts`); the look did not change in the move.
//
// Three variants (`primary`, `quiet`, `danger`) plus a default — the button carries the whole
// axis: the default and the variant×state intersections both live on it. Fewer than three would
// not be enough — with two, "an intersection across several variants at once" would degenerate
// into "for just the one".

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Look transition — same approach as the accordion: different durations on neighboring nodes is a defect. */
const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

/**
 * BUTTON. One part, seven states, three variants.
 *
 * Height is taken from the `--control-height-md` step, not from a minimum-tap-size threshold: at
 * density 1 that step sits a comfortable margin above the minimum target size.
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        letterSpacing: "var(--tracking-normal)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        // The focus ring is step eight: it is exactly "a strong border and a focus ring".
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        hover: { props: { cursor: "pointer" } },
        active: { props: { transform: "translateY(var(--border-width-1))" } },
        disabled: {
          props: { opacity: "0.5", cursor: "not-allowed" },
          states: { hover: { props: { transform: "none" } } },
        },
        busy: { props: { cursor: "progress" } },
        expanded: { props: { borderColor: "var(--accent-8)" } },
        pressed: { props: { borderColor: "var(--accent-8)", fontWeight: "var(--weight-semibold)" } },
      },
    },
  },
  variants: {
    primary: {
      root: {
        props: {
          background: "var(--accent-9)",
          color: "var(--accent-contrast)",
          // The border exists and is invisible ON PURPOSE: it keeps the box the same solid size
          // as the outlined variant. A contrast checker would call it "nothing to measure" — the
          // right answer: a fully transparent border says nothing about what lies beneath it.
          borderColor: "transparent",
        },
        states: {
          hover: { props: { background: "var(--accent-10)", color: "var(--accent-contrast)" } },
        },
      },
    },
    quiet: {
      root: {
        props: {
          background: "var(--neutral-3)",
          color: "var(--neutral-12)",
          borderColor: "var(--neutral-7)",
        },
        states: {
          hover: { props: { background: "var(--neutral-4)", color: "var(--neutral-12)" } },
          active: { props: { background: "var(--neutral-5)", color: "var(--neutral-12)" } },
        },
      },
    },
    danger: {
      root: {
        props: {
          background: "var(--danger-9)",
          color: "var(--danger-contrast)",
          borderColor: "transparent",
        },
        states: {
          hover: { props: { background: "var(--danger-10)", color: "var(--danger-contrast)" } },
        },
      },
    },
  },
  defaultVariant: "primary",
  compoundVariants: [
    {
      // Shared by TWO solid variants at once — exactly the case an intersection exists for:
      // nesting would have required writing it twice.
      variants: ["primary", "danger"],
      states: ["active"],
      style: { root: { props: { filter: "brightness(0.94)" } } },
    },
  ],
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "button-sample", component: "button", recipe };
