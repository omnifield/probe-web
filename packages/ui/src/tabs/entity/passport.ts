// RUNTIME passport of tabs — anatomy (`anatomy.ts`) plus everything else the running app needs:
// per-part STATES, the variant axis, and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/tabs/tabs.connect.mjs`, the same rigor the rest of the
// kit's passports read from a `.connect.mjs`.
//
// ## `trigger`'s focus is REAL, not mirrored — unlike the checkbox's or the switch's
//
// `trigger` is a genuine `<button>` that receives real DOM focus itself (`onFocus`/`onBlur` sit
// directly on it, not on some hidden sibling), and `data-focus` faithfully tracks exactly that —
// `context.get("focusedValue") === value`. `:focus-visible` is declared ALONGSIDE it, not instead
// of it: `data-focus` says "focused", full stop, while `:focus-visible` carries information
// `data-focus` does not — whether that focus arrived from the keyboard. Both are real and say
// different things, so both are declared, once each.
//
// ## The indicator's `--left`/`--top`/`--width`/`--height` are the measured, sliding position
//
// The same device as the accordion's `--height`, `PWEB-89`: the kit measures the selected
// trigger's box and places these four custom properties on the indicator node
// (`getIndicatorProps`) — without them the "slides under the active tab" look has nothing to
// address. `--transition-duration`/`--transition-timing-function` are READ by the kit with a
// fallback (`var(--transition-duration, 150ms)`) rather than measured and written — the reverse
// direction from a `PassportVariable`, and neither of the model's two `setBy` values names that
// shape honestly (not "kit" — the kit does not compute a value; not quite "consumer" either,
// since the fallback means nothing breaks if it is left unset). Left UNDECLARED rather than
// forced into either box — a finding, not a decision made quietly here.
//
// ## `data-value`/`data-ownedby`/`data-ssr` on `trigger` are identity, not look
//
// `data-value` names WHICH tab, the same category `AccordionItem`'s `value` prop already stands
// outside the passport for. `data-ownedby` points at the list's id (wiring, not a look).
// `data-ssr` is an environment/timing fact (has hydration settled yet), not something a skin
// author would ever key a rule on — none of the three are declared.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid and no Ark. Needed only so the setting keys are
// checked against the component's real props.
import type { TabsProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Focus — real DOM focus on `root`/`list` is meaningless on their own; this reflects the machine's own "some trigger is focused". */
const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;

/** Passport of tabs — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [focus] },
    { name: "list", states: [focus] },
    {
      name: "trigger",
      states: [
        { name: "selected", mark: { kind: "attribute", name: "data-selected" } },
        // Data over native `:disabled`: `getTriggerProps` writes BOTH a real `disabled`
        // attribute and `data-disabled` — the mark that is explicitly emitted is the one
        // declared, the same choice the button's own passport already makes.
        { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } },
        focus,
        // A genuine `<button>` with no JS-tracked pointer state — the browser gives these for
        // free, the same reasoning the plain button's passport already applies.
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "content",
      // `hidden` (native, present whenever NOT selected) is not declared separately: it is the
      // same fact `selected` already carries, checked the same way the checkbox's own indicator
      // excludes its redundant `hidden`.
      states: [{ name: "selected", mark: { kind: "attribute", name: "data-selected" } }],
    },
    {
      name: "indicator",
      // No states: the ONLY conditional mark on it (`hidden`, present until the first tab is
      // measured) is a bootstrapping/timing artifact — the same category as `trigger`'s
      // `data-ssr` — not a look condition a skin author would key a rule on.
      states: [],
      variables: [
        { name: "--left", setBy: "kit" },
        { name: "--top", setBy: "kit" },
        { name: "--width", setBy: "kit" },
        { name: "--height", setBy: "kit" },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // ONE setting from the closed vocabulary applies: `orientation` (`PWEB-89`) — the same name,
  // the same shape, and the same mark as the accordion's own (`data-orientation`, checked present
  // on all five parts above, `PWEB-104`'s own standard for calling a mark "verified"). `disabled`
  // is excluded the same way the checkbox excludes it: already a STATE on `trigger`, a per-tab
  // fact, not an axis an author picks for the whole set.
  settings: defineSettings<TabsProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "horizontal" }, { value: "vertical" }],
      },
      byDefault: "horizontal",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  }),
});
