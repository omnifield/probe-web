// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — meant to prove the
// select's passport CAN be dressed whole by the real skin mechanism, the same role the
// accordion's and the button's own recipes play.
//
// Fifteen parts, most of them sharing one look concern (`control`'s border communicates the same
// thing whether it comes from focus, invalidity, or disabledness) — the base stays close to the
// button's own shapes (height, radius, border) since a closed select reads as a button that opens
// something. No shadow anywhere: the token scale (`packages/style`) has no elevation/shadow scale
// at all yet, and a proof recipe does not invent a token the rest of the kit cannot also reach for.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Look transition — same device as the rest of the kit: different durations on neighbors is a defect. */
const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

/**
 * SELECT. Fifteen parts; the control carries the border, the content carries the floating shadow.
 *
 * The floating content is sized against the trigger it belongs to (`--reference-width`) and
 * capped by whatever room the viewport actually has (`--available-height`) — without either, a
 * narrow trigger would open a dropdown wider than itself, or a long list would run off-screen with
 * nothing to stop it.
 */
export const recipe: SlotRecipe = {
  base: {
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    control: {
      // `flex`/`width: 100%`, not `inline-flex` — an `inline-flex` box shrink-wraps its content,
      // and a long, `nowrap` value (`valueText` below) then grows the box past its container
      // instead of the box clamping the text. Found live, 2026-08-30, composed inside a real
      // sidebar panel with unpredictable caption length.
      props: {
        display: "flex",
        width: "100%",
        alignItems: "stretch",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        focus: { props: { borderColor: "var(--accent-8)" } },
        invalid: { props: { borderColor: "var(--danger-9)" } },
        disabled: { props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)" } },
      },
    },
    trigger: {
      props: {
        display: "flex",
        flex: "1",
        // A flex item's automatic MIN width is its content's min-content size by default — for a
        // `nowrap` label that's the label's full, unbroken width, and it wins over `flex: 1`
        // trying to shrink the item back down. `minWidth: 0` opts out of that default; `valueText`
        // itself keeps the actual clamp (`overflow: hidden` down below).
        minWidth: "0",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        background: "transparent",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-none)",
        textAlign: "start",
        cursor: "pointer",
      },
      states: {
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "calc(var(--border-width-2) * -1)",
          },
        },
        disabled: { props: { cursor: "not-allowed" } },
      },
    },
    valueText: {
      props: { minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      // `placeholder` IS NOT A STATE OF THIS PART (`entity/passport.ts`: valueText only declares
      // disabled/invalid/focus) — the mark sits on `trigger`, which contains it. Addressed through
      // the ancestor, the same device the accordion uses to color content by its item's state.
      states: { disabled: { props: { color: "var(--neutral-11)" } } },
      ancestors: [
        {
          component: "select",
          part: "trigger",
          states: ["placeholder"],
          style: { props: { color: "var(--neutral-11)" } },
        },
      ],
    },
    clearTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingInline: "var(--space-2)",
        color: "var(--neutral-11)",
        cursor: "pointer",
      },
      states: {
        hover: { props: { color: "var(--neutral-12)" } },
        disabled: { props: { cursor: "not-allowed", opacity: "0.5" } },
      },
    },
    indicator: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingInline: "var(--space-2)",
        color: "var(--neutral-11)",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { transform: "rotate(180deg)" } },
      },
    },
    // SIZE CAPS `positioner`, NOT `content`: the passport puts `--available-width`/
    // `--available-height` on `positioner` (`entity/passport.ts`) — the node that actually carries
    // them. `content` used to read these same variables on ITSELF rather than on its parent: the
    // skin mechanism rejects that ("the passport declares the variable on a different part") — the
    // rule would have landed on the page with an unresolvable value. `content` just scrolls inside.
    positioner: {
      props: {
        maxWidth: "var(--available-width)",
        maxHeight: "var(--available-height)",
      },
    },
    content: {
      // `display`/`flexDirection` live under `states.open`, NOT here — `data-state` on `content`
      // is unconditional (`entity/passport.ts`: always "open" or "closed", never absent), and Zag
      // ALSO sets the native `hidden` attribute while closed (`select.connect.mjs`,
      // `getContentProps`). `[hidden]`'s `display: none` is a user-agent rule — the lowest
      // priority there is — and an unconditional `display: flex` HERE is still an author rule
      // that beats it outright. Found live, 2026-08-30: Zag correctly closed (`hidden=""`,
      // `data-state="closed"`, confirmed by hand in the DOM), the panel stayed on screen anyway,
      // and Zag itself had already stopped listening for interaction on it — visible but dead,
      // exactly what a `display` fight with `[hidden]` produces. Scoping `display` to `open`
      // means CLOSED gets no author `display` rule at all, and `[hidden]` wins by default.
      props: {
        gap: "var(--space-1)",
        padding: "var(--space-1)",
        overflow: "auto",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        background: "var(--neutral-1)",
      },
      states: {
        open: { props: { display: "flex", flexDirection: "column" } },
      },
    },
    itemGroupLabel: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        fontSize: "var(--font-size-sm)",
        color: "var(--neutral-11)",
      },
    },
    item: {
      props: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-2)",
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        borderRadius: "var(--radius-sm)",
        color: "var(--neutral-12)",
        cursor: "pointer",
      },
      states: {
        highlighted: { props: { background: "var(--neutral-4)" } },
        checked: { props: { fontWeight: "var(--weight-medium)" } },
        disabled: { props: { color: "var(--neutral-11)", cursor: "not-allowed" } },
      },
    },
    // `display` IS NOT IN THE BASE: the kit hides the unchecked indicator with the `hidden`
    // attribute (native `display: none`), and an unconditional `display: inline-flex` in the base
    // would override that for EVERY item at once — every checkmark would show simultaneously.
    // `display` is set only alongside `checked`, when the kit has already lifted `hidden` and the
    // node is genuinely shown.
    itemIndicator: {
      props: { color: "var(--accent-9)" },
      states: { checked: { props: { display: "inline-flex" } } },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "select-sample", component: "select", recipe };
