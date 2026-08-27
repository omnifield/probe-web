// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated,
// a live browser scrolls and jumps frame by frame). Same physical shape as every other
// component's `playground/recipe.ts` (`PWEB-127`).
//
// ONE LOOK, no named variants — the shipped look with variants lives in the presets service, the
// same split the accordion's own playground recipe stands on (`component-skin-recipe`). This
// file only has to prove dressability and give the settings axis a base to branch from.
//
// `item`'s `opacity` (dim unless `inview`) is the only place `item`'s own state gets used: with
// `slidesPerPage` above 1 it visibly marks which slide is the "current" one among several shown
// at once — `data-inview` is real (`../entity/passport.ts`), not invented for this file.
//
// `indicator` does NOT read `--left`/`--top`/`--width`/`--height`: unlike the tabs' own sliding
// bar, Carousel's own `Indicator` carries no such custom properties in Ark's docs (verified via
// the `ark-ui` MCP, 2026-08-26) — it is a plain per-slide dot, current/not-current, nothing to
// measure. The comment that shipped with this file's template claimed otherwise; that claim did
// not survive a check against the real component and is not carried forward here.

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
    // No `disabled` here (unlike the nav buttons): the passport declares none for this part
    // (`../entity/passport.ts`) — the autoplay toggle is always clickable.
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

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "carousel-sample", component: "carousel", recipe };
