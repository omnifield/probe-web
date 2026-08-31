// RUNTIME passport of the dialog — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/dialog/dialog.connect.mjs` (113 lines, read in full),
// the same rigor the rest of the kit's passports read from a `.connect.mjs`.
//
// ## There is NO `root` part — `positioner` stands in, the popover's own precedent
//
// `@zag-js/dialog/anatomy` declares no `root` (`../entity/anatomy.ts` — seven parts, none named
// `root`), for the same reason the popover has none: `DialogRoot` renders no DOM node of its own.
// `positioner` is the part that actually contains what a dialog visually IS (`content` — with
// `title`/`description`/`closeTrigger` inside it, all real children in Ark's own documented
// composition); `trigger`/`backdrop` are real DOM SIBLINGS of `positioner`, not nested under it,
// so neither is in `positioner`'s `accepts` (`playground/parts.ts`) — the exact same limitation
// the popover's own passport already names for `trigger`/`anchor`, not solved differently here.
//
// ## `positioner` has NO geometry variables — unlike the popover's/select's/date picker's
//
// `getPositionerProps` sets only `style: compact({ pointerEvents: ... })` — no
// `@zag-js/popper` import anywhere in this connector at all. A dialog centers with plain CSS
// (typically `display: flex; place-items: center` on the positioner, a skin's own call), it does
// not float against a trigger the way a popover/select/date-picker's content does — checked as an
// absence, not assumed from a smaller connector.
//
// ## `backdrop`/`content` both get `data-state`, `closeTrigger` gets NEITHER
//
// `getCloseTriggerProps` sets no `data-*` mark at all (only `id`/`dir`/`onClick`) — the exact
// shape the popover's own `closeTrigger` already has: a real `<button>` addressed only by pseudo-
// classes below, no boolean look-state of its own.
//
// ## `trigger`'s `current`/`hover`/`focus-visible`/`active` — the popover's own trigger, verbatim
//
// Same shape, same reasoning, same source category: `data-current` is real only in a multi-
// trigger dialog (`value` prop, distinguishing WHICH dialog a shared trigger opens/switches to);
// a genuine `<button>` with no JS-tracked pointer state gets the pseudo trio for free.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { DialogProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Open — unconditional: the sibling value is always `closed`. */
const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

/** Closed — the same attribute, the other value. */
const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

const openClosed: readonly PassportState[] = [open, closed];

/** A genuine button with no JS-tracked pointer state — the plain button's own reasoning. */
const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

/** Passport of the dialog — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  // See "There is NO `root` part" above: `positioner` stands in, deliberately, not by omission.
  root: "positioner",
  parts: [
    {
      name: "trigger",
      states: [
        ...openClosed,
        // Present only in a multi-trigger dialog (`value` prop) — real either way, always
        // written as a boolean (`dataAttr(current)`).
        { name: "current", mark: { kind: "attribute", name: "data-current" } },
        ...buttonPseudos,
      ],
    },
    // `hidden` (native, present while closed) is not declared separately: the same fact
    // `data-state` already carries, the checkbox's own indicator's own exclusion.
    { name: "backdrop", states: openClosed },
    {
      name: "positioner",
      // No states: pure positioning, style only. No variables either — see the file header.
      states: [],
    },
    // `tabIndex={-1}` (focusable only by script) — no hover/press surface, the popover's own
    // `content` makes the same choice for the same reason.
    { name: "content", states: openClosed },
    { name: "title", states: [] },
    { name: "description", states: [] },
    { name: "closeTrigger", states: buttonPseudos },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `modal`/`role`/`closeOnEscape`/
  // `closeOnInteractOutside`/`trapFocus`/`preventScroll`/`restoreFocus` are all real props, but
  // none is `orientation`/`multiple`/`collapsible` — the same empty result the popover's own
  // settings already show.
  settings: defineSettings<DialogProps>()({}),
});
