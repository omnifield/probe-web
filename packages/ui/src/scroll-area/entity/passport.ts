// RUNTIME passport of the scroll area — anatomy (`anatomy.ts`) plus everything else the running
// app needs: per-part STATES, the variant axis, and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/scroll-area/scroll-area.connect.mjs` (207 lines, read
// in full), the same rigor the rest of the kit's passports read from a `.connect.mjs`.
//
// ## `hover`/`dragging` are ONE SHARED value across `scrollbar`/`thumb`/`corner` — not per-element
//
// `getScrollbarProps`/`getThumbProps`/`getCornerProps` all spread the SAME `context.get(
// "hovering")`/`state.matches("dragging")` onto `data-hover`/`data-dragging` — a single,
// service-level fact ("is the pointer anywhere near this scroll area's own affordances right
// now"), not "is the pointer literally over THIS node." A skin rule keyed on `scrollbar`'s own
// `hover` can fire while the pointer sits over `thumb`, and that is not a bug in the mark — it is
// what the connector actually computes, named here so it is not mistaken for a native `:hover`
// substitute the way the checkbox's own JS-tracked hover is.
//
// ## `overflow-x`/`overflow-y` reach FIVE parts, `thumb` is the one exception
//
// `root`/`viewport`/`content`/`scrollbar`/`corner` all carry `data-overflow-x`/`data-overflow-y`
// (checked on each `getXxxProps`); `getThumbProps` alone never sets either — checked as an
// absence, not assumed from the other four agreeing.
//
// ## `scrollbar`/`thumb` share `data-orientation` — the SAME two values, TWO real nodes each
//
// A two-axis scroll area renders each of `scrollbar`/`thumb` TWICE (`../entity/anatomy.ts`'s own
// header explains the "one part, several nodes" shape) — `"vertical"`/`"horizontal"` is which
// instance a given node is, not a setting an author picks once: each render call supplies its own
// `orientation` prop, so it is a STATE here, the same category the date picker's own `view`
// three-way already is (real, runtime, not editor-fixed).
//
// ## `root`'s four measured variables are read by OTHER parts' own inline styles
//
// `getRootProps` writes `--corner-width`/`--corner-height`/`--thumb-width`/`--thumb-height` on
// `root`'s own `style` — but `getScrollbarProps`/`getThumbProps`/`getCornerProps` all reference
// them back via `var(...)` in THEIR OWN inline styles (e.g. `thumb`'s own `height:
// var(--thumb-height)`). Declared once, on `root`, where the kit actually WRITES them — the same
// "variables live where the kit places them, not where CSS happens to read them" rule the
// accordion's own `--height` (written on `content`, not consumed anywhere else in the connector)
// already follows; custom properties cascading to descendants is ordinary CSS, not a passport
// concern.
//
// ## `corner`'s `data-state` is a MARK, not automatic hiding
//
// `hiddenState.cornerHidden ? "hidden" : "visible"` is a `data-state` value, never a native
// `hidden` attribute — a skin has to act on it for the corner to actually disappear when only one
// axis scrolls, the kit does not hide it unprompted (`../components/index.tsx`'s own doc comment
// names this too).

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { ScrollAreaProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Horizontal content overflows — a scrollbar CAN exist on this axis. */
const overflowX = { name: "overflow-x", mark: { kind: "attribute", name: "data-overflow-x" } } as const satisfies PassportState;
/** Vertical content overflows — the same fact, the other axis. */
const overflowY = { name: "overflow-y", mark: { kind: "attribute", name: "data-overflow-y" } } as const satisfies PassportState;
const overflowStates: readonly PassportState[] = [overflowX, overflowY];

/** Which axis this instance is — TWO real nodes per part, see the file header. */
const vertical = { name: "vertical", mark: { kind: "attribute", name: "data-orientation", value: "vertical" } } as const satisfies PassportState;
const horizontal = { name: "horizontal", mark: { kind: "attribute", name: "data-orientation", value: "horizontal" } } as const satisfies PassportState;
const orientationStates: readonly PassportState[] = [vertical, horizontal];

/** ONE service-level fact mirrored onto three parts — see the file header, not literal per-node hover. */
const hover = { name: "hover", mark: { kind: "attribute", name: "data-hover" } } as const satisfies PassportState;
const dragging = { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } } as const satisfies PassportState;
const hoverDragging: readonly PassportState[] = [hover, dragging];

/** Passport of the scroll area — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: overflowStates,
      variables: [
        { name: "--corner-width", setBy: "kit" },
        { name: "--corner-height", setBy: "kit" },
        { name: "--thumb-width", setBy: "kit" },
        { name: "--thumb-height", setBy: "kit" },
      ],
    },
    {
      name: "viewport",
      states: [
        ...overflowStates,
        { name: "at-top", mark: { kind: "attribute", name: "data-at-top" } },
        { name: "at-bottom", mark: { kind: "attribute", name: "data-at-bottom" } },
        { name: "at-left", mark: { kind: "attribute", name: "data-at-left" } },
        { name: "at-right", mark: { kind: "attribute", name: "data-at-right" } },
      ],
    },
    { name: "content", states: overflowStates },
    { name: "scrollbar", states: [...orientationStates, ...overflowStates, ...hoverDragging, { name: "scrolling", mark: { kind: "attribute", name: "data-scrolling" } }] },
    // No overflow states here — see the file header ("`thumb` is the one exception").
    { name: "thumb", states: [...orientationStates, ...hoverDragging] },
    {
      name: "corner",
      states: [
        ...overflowStates,
        hover,
        { name: "hidden", mark: { kind: "attribute", name: "data-state", value: "hidden" } },
        { name: "visible", mark: { kind: "attribute", name: "data-state", value: "visible" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: the scroll area has no `orientation` prop of
  // its own (the STATE above is per-instance, not author-picked) and no `multiple`/`collapsible`
  // concept — the same empty result the plain button's and the dialog's own settings already show.
  settings: defineSettings<ScrollAreaProps>()({}),
});
