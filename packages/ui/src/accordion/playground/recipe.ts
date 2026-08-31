// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. The kit holds "zero
// styles by default" (README, "Four principles"), and this file does not break that: it lives
// next to the component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only
// `accordion.test.tsx` reads it, to prove the accordion's passport CAN be dressed whole by the
// real skin mechanism (`skinGaps` empty, CSS is generated, a live browser expands and collapses
// items frame by frame). This used to be proven by a separate package, `packages/skin-reference`
// (removed, `PWEB-110`) — now the component proves itself, in its own folder.
//
// Ported line-for-line from `packages/skin-reference/src/recipes.ts` (git history is intact at
// `git show 5d560ae:packages/skin-reference/src/recipes.ts`); the look did not change in the
// move — what was found along the way is its own topic, not mixed in with the port.
//
// ## Color is addressed by STEP, not by value
//
// Not one color literal: a rule names a step (`var(--accent-9)`), and the skin re-seeds because
// of it. Steps are assigned by the values zone — 9 the solid accent, 10 the same on hover,
// 8 a strong border and the focus ring, 11 low-contrast text, 12 high-contrast.
//
// Fill and text are declared IN ONE rule everywhere text exists: the readability count considers
// a PAIR, and text with no fill named next to it drifts into "nothing to count".

import type { Form, Keyframes, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Look transition — same device as the button: different durations on neighboring nodes is a defect. */
const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

/**
 * EXPAND AND COLLAPSE — the accordion's named motions (`PWEB-98`).
 *
 * Both share one measure that belongs to someone else: the kit places `--height` after measuring
 * the node, on the very content the motion applies to. A motion step resolves on an ANIMATED
 * element (`PWEB-101`), which is why the name is legal here — and there is no other way to get
 * the height: `auto` does not animate, and a number cannot be invented for someone else's content.
 *
 * PADDING RIDES ALONG WITH HEIGHT, and that is not decoration. The content treats its box as an
 * outer measure (`box-sizing: border-box` in the base), and with an outer measure a height of
 * zero does NOT remove padding — the box would hit it and stay two paddings above zero. A
 * collapsed item would become a stripe.
 *
 * Two motions, not one played in reverse: the reverse direction is set by a rule
 * (`animation-direction`), i.e. by the same address, and expand and collapse have DIFFERENT
 * addresses — the first does not always arrive, the second always does.
 *
 * CHECKED AGAINST THE MARKET 2026-08-24. The provider documents exactly this record — `--height`
 * in keyframes and `[data-part="item-content"][data-state="open"|"closed"]` in rules
 * (`ark-ui.com`, the "Accordion" and "Collapsible" pages). CSS's standard answer to "animate to
 * `auto`" (`interpolate-size: allow-keywords` together with `calc-size()`) is NOT taken: it
 * remains Chromium-only — neither Firefox nor Safari support it.
 */
export const keyframes: Keyframes = {
  expand: {
    from: { height: "0", paddingBlock: "0" },
    to: { height: "var(--height)", paddingBlock: "var(--space-3)" },
  },
  collapse: {
    from: { height: "var(--height)", paddingBlock: "var(--space-3)" },
    to: { height: "0", paddingBlock: "0" },
  },
  /**
   * EXPAND SIDEWAYS — same device, a different axis (`PWEB-105`).
   *
   * The passport declares `--width` RIGHT NEXT TO `--height`, under the same words: "a
   * horizontal accordion needs it". The variant axis has nothing to do with this — horizontal is
   * `settings.orientation`, what the component TURNED OUT TO BE, not what the skin's author
   * chose, and its address is the same path a variant's is.
   *
   * The axis is expressed with INLINE padding, not block padding: `paddingInline` sits on the
   * same side of the box as `width` — symmetric with the vertical case, where `paddingBlock` sits
   * on `height`'s side.
   */
  "expand-sideways": {
    from: { width: "0", paddingInline: "0" },
    to: { width: "var(--width)", paddingInline: "var(--space-4)" },
  },
  "collapse-sideways": {
    from: { width: "var(--width)", paddingInline: "var(--space-4)" },
    to: { width: "0", paddingInline: "0" },
  },
};

/**
 * ACCORDION. Five parts, fifteen states.
 *
 * The content's expanded look is addressed through its ancestor: the content's own expansion
 * mark does not always arrive, and the passport declares that outright. There is no way to
 * express such a rule without an ancestor address — that is exactly why the field exists in the
 * model.
 */
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
    itemTrigger: {
      props: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-2)",
        // `control-height-sm`/`space-3` — the OTHER half of the same documented pair
        // (`packages/style/src/dimension.ts`'s `SPACE_ROLES`, enforced by `test/space-roles.
        // test.ts`), not `md`/`space-4` any more: found too roomy live, 2026-08-30.
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
    itemContent: {
      props: {
        paddingInline: "var(--space-4)",
        paddingBlock: "var(--space-3)",
        background: "var(--neutral-1)",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-relaxed)",
        // THE SKIN WRITES THE EXPANSION (`PWEB-93`), AS A NAMED MOTION (`PWEB-98`). The kit's
        // measure is OUTER (`getBoundingClientRect`), so the box here is outer too — otherwise
        // `height: var(--height)` would add its own two paddings on top of someone else's measure.
        overflow: "hidden",
        boxSizing: "border-box",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        // EXPAND — by its OWN mark, the very one that does not always arrive (`PWEB-97`).
        open: {
          props: {
            animation: "expand var(--motion-normal) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
        // COLLAPSE — by the collapsed mark; it always arrives on the content.
        closed: {
          props: {
            animation: "collapse var(--motion-normal) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
        disabled: { props: { color: "var(--neutral-11)", background: "var(--neutral-2)" } },
        focus: { props: { color: "var(--neutral-12)", background: "var(--neutral-1)" } },
      },
      ancestors: [
        {
          // Expanded content — by the OWNER's state: the content's own mark does not always
          // arrive, and the passport says so outright.
          //
          // THE BOX IS GONE HERE, and that is not taste. The kit measures the node TWICE — while
          // expanding and while collapsing — and while collapsing, it measures content whose item
          // is ALREADY not expanded. An ancestor rule that changes the box would land in the
          // second measurement.
          component: "accordion",
          part: "item",
          states: ["open"],
          style: { props: { color: "var(--neutral-12)" } },
        },
      ],
    },
    itemIndicator: {
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
  },
  /**
   * HORIZONTAL LAYOUT (`PWEB-105`) — what the component TURNED OUT TO BE, not what the skin's
   * author chose. The kit and the vertical case are untouched here: the accordion's base stays
   * the same, and the condition lives RIGHT NEXT to a variant, the same resolution path — no
   * branch of its own was set up for it.
   */
  settings: {
    orientation: {
      horizontal: {
        root: { props: { flexDirection: "row" } },
        item: { props: { flexDirection: "row" } },
        itemContent: {
          states: {
            open: {
              props: {
                animation: "expand-sideways var(--motion-normal) var(--ease-out)",
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              },
            },
            closed: {
              props: {
                animation: "collapse-sideways var(--motion-normal) var(--ease-out)",
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              },
            },
          },
        },
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "accordion-sample", component: "accordion", recipe, keyframes };
