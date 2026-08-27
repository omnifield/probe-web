// RUNTIME passport of the drawer — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/drawer/drawer.connect.mjs` (271 lines, read in full),
// the same rigor the rest of the kit's passports read from a `.connect.mjs`.
//
// ## There is NO `root` part — `positioner` stands in, the popover's/dialog's own precedent
//
// `DrawerRoot` renders no DOM node of its own (checked in `@ark-ui/solid`'s own `drawer-root.tsx`:
// pure context/presence providers) — the same situation, the same stand-in choice.
//
// ## `swipeDirection` is a real STATE, not a setting — it fails the closed vocabulary by NAME
//
// `data-swipe-direction` (`"up"`/`"down"`/`"left"`/`"right"` — `SwipeDirection` is `"up" | "down"
// | "start" | "end"` at the PROP, `resolveSwipeDirection` resolves `"start"`/`"end"` to physical
// `"left"`/`"right"` per `dir`, checked in `utils/drawer-session.mjs`) behaves exactly like an
// author-picked axis — fixed for the component's lifetime, not something a user's interaction
// changes — the same shape the tabs' own `orientation` setting has. It cannot BE a setting anyway:
// `defineSettings` only recognizes `orientation`/`multiple`/`collapsible` by NAME, and
// `"swipeDirection"` matches none of them — the date picker's own `view` hit the identical wall
// (real, runtime-fixed, ineligible by name) and was declared a state for the same reason.
// Default: `"down"` (`drawer.machine.mjs`'s own `props()` default, checked live).
//
// ## Eleven measured variables on `content`, two more on `backdrop` — the richest variable surface in the kit
//
// All are written by the CONNECTOR itself, on the SAME node that consumes them in its own inline
// `style` (unlike the scroll area's own root-writes/children-read split) — `content` drives its
// own `transform` from its own `--drawer-translate-x`/`--drawer-translate-y`.
// `--drawer-swipe-strength` is written on BOTH `content` and `backdrop` independently (checked —
// each `getXxxProps` sets its own copy, not one cascading from the other), so it is declared on
// both, not once. `--drawer-translate` (no `-y` suffix, always the SAME value as
// `--drawer-translate-y`) is declared as written, not folded into its sibling: the connector sets
// it as a genuinely separate assignment, and this passport does not guess why a second name exists
// for the same number.
//
// ## `grabber` is a real interactive `<div>`, `grabberIndicator`/`title`/`description` are bare
//
// `grabber` has no `data-*` mark at all (only `id`/`onPointerDown`/`style`), but IS a real,
// pointer-down-handled node — `hover`/`active` pseudo-classes apply (a browser hovers/presses any
// element under the pointer, tag notwithstanding, the `tableCellTrigger`'s own reasoning in the
// date picker's passport); no `tabIndex` is ever set on it, so it cannot receive keyboard focus,
// and `:focus-visible` is not declared. `grabberIndicator` carries no mark of any kind — a pure
// decorative bar, content-free by Ark's own documented usage.
//
// ## `trigger`/`closeTrigger` — the popover's own trigger/closeTrigger shape, verbatim
//
// `trigger` gets `data-state`/`data-current` plus the pseudo trio (no native `disabled` at all in
// this connector, checked); `closeTrigger` gets NO `data-*` mark whatsoever, pseudo trio only —
// the exact shape the popover's/dialog's own `closeTrigger` already has.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { DrawerProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** Open — unconditional: the sibling value is always `closed`. Shared by `positioner`/`content`/`trigger`/`backdrop`/`swipeArea`. */
const open: PassportState = { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } };
/** Closed — the same attribute, the other value. */
const closed: PassportState = { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } };
const openClosed: readonly PassportState[] = [open, closed];

/** Which physical edge the drawer slides from/dismisses toward — real, runtime-fixed, not settings-eligible (see file header). */
const swipeUp: PassportState = { name: "up", mark: { kind: "attribute", name: "data-swipe-direction", value: "up" } };
const swipeDown: PassportState = { name: "down", mark: { kind: "attribute", name: "data-swipe-direction", value: "down" } };
const swipeLeft: PassportState = { name: "left", mark: { kind: "attribute", name: "data-swipe-direction", value: "left" } };
const swipeRight: PassportState = { name: "right", mark: { kind: "attribute", name: "data-swipe-direction", value: "right" } };
const swipeDirectionStates: readonly PassportState[] = [swipeUp, swipeDown, swipeLeft, swipeRight];

/** A drag or an opening swipe is in progress right now — shared by `content`/`backdrop`/`swipeArea`, one condition each. */
const swiping: PassportState = { name: "swiping", mark: { kind: "attribute", name: "data-swiping" } };
/** A drag specifically (not the post-release settle) — `content` only. */
const dragging: PassportState = { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } };

/** A genuine button with no JS-tracked pointer state — the plain button's own reasoning. */
const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

/** Passport of the drawer — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  // See "There is NO `root` part" above: `positioner` stands in, deliberately, not by omission.
  root: "positioner",
  parts: [
    { name: "positioner", states: [...openClosed, ...swipeDirectionStates] },
    {
      name: "content",
      states: [
        ...openClosed,
        ...swipeDirectionStates,
        swiping,
        dragging,
        { name: "expanded", mark: { kind: "attribute", name: "data-expanded" } },
        { name: "nested-drawer-open", mark: { kind: "attribute", name: "data-nested-drawer-open" } },
        { name: "nested-drawer-swiping", mark: { kind: "attribute", name: "data-nested-drawer-swiping" } },
      ],
      variables: [
        { name: "--drawer-translate", setBy: "kit" },
        { name: "--drawer-translate-x", setBy: "kit" },
        { name: "--drawer-translate-y", setBy: "kit" },
        { name: "--drawer-snap-point-offset-x", setBy: "kit" },
        { name: "--drawer-snap-point-offset-y", setBy: "kit" },
        { name: "--drawer-swipe-movement-x", setBy: "kit" },
        { name: "--drawer-swipe-movement-y", setBy: "kit" },
        { name: "--drawer-swipe-strength", setBy: "kit" },
        { name: "--nested-drawers", setBy: "kit" },
        { name: "--drawer-height", setBy: "kit" },
        { name: "--drawer-frontmost-height", setBy: "kit" },
      ],
    },
    { name: "title", states: [] },
    { name: "description", states: [] },
    {
      name: "trigger",
      states: [
        ...openClosed,
        { name: "current", mark: { kind: "attribute", name: "data-current" } },
        ...buttonPseudos,
      ],
    },
    {
      name: "backdrop",
      states: [...openClosed, swiping],
      variables: [
        { name: "--drawer-swipe-progress", setBy: "kit" },
        { name: "--drawer-swipe-strength", setBy: "kit" },
      ],
    },
    {
      name: "grabber",
      states: [
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "grabberIndicator", states: [] },
    { name: "closeTrigger", states: buttonPseudos },
    {
      name: "swipeArea",
      states: [
        ...openClosed,
        ...swipeDirectionStates,
        swiping,
        { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `swipeDirection` is real but ineligible by
  // name (see the file header); `snapPoints`/`modal`/`trapFocus`/etc. are real props with nothing
  // in the closed vocabulary to attach to — the same empty result the dialog's own settings show.
  settings: defineSettings<DrawerProps>({}),
});
