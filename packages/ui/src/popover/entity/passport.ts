// RUNTIME passport of the popover — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/popover/popover.connect.mjs`, the same rigor the rest
// of the kit's passports read from a `.connect.mjs`. The doc page lists `data-nested`/
// `data-has-nested` on `content` — the connector writes NEITHER; not declared, the same finding
// pattern the select's own passport already logs against its own doc page.
//
// ## `content`'s `data-expanded` is REDUNDANT with `data-state`, not a second fact
//
// `getContentProps` writes both `"data-state": open ? "open" : "closed"` AND
// `"data-expanded": dataAttr(open)` — the exact same boolean, two attributes. Declaring both as
// separate PASSPORT states would hand a skin author two knobs for one fact, the same category of
// redundancy the checkbox's own `indicator` excludes its `hidden` for. Only `open`/`closed` is
// declared; `data-expanded` is left unaddressed.
//
// ## `positioner`'s geometry variables — the SAME popper mechanism as the select's
//
// `getPositionerProps` sets `style: popperStyles.floating`, from the identical `@zag-js/popper`
// package the select's own positioner already stands on (`select/entity/passport.ts`) — the same
// four custom properties get written on the SAME kind of node for the SAME reason: `--reference-
// width`/`--reference-height` size the floating content against its trigger, `--available-width`/
// `--available-height` cap it against the viewport. `--x`/`--y`/`--z-index` are excluded for the
// same reason they are there: positioning internals, not a skin-facing hook.
//
// ## `trigger`'s real DOM focus, `content`'s programmatic-only one
//
// `trigger` is a genuine `<button>` — hover/focus-visible/active are honest native pseudo-classes,
// the same reasoning the plain button's passport already applies. `content` gets `tabIndex={-1}`
// (focusable only by script, e.g. when `modal`), not a natural hover/press surface — no
// pseudo-classes declared for it, the same choice the select's own `content` already makes.
//
// ## There is NO `root` part — `positioner` stands in as the passport's nominal root
//
// `@zag-js/popover/anatomy` declares no `root` at all (`../entity/anatomy.ts` — ten parts, none
// named `root`), and for a real reason: `PopoverRoot` renders NO DOM node of its own — checked in
// `@ark-ui/solid`'s own `popover-root.tsx`, it is `<PopoverProvider><PresenceProvider>
// {children}</PresenceProvider></PopoverProvider>`, pure context, nothing else. In the real
// rendered DOM, `trigger`/`anchor`/`positioner` are SIBLINGS, tied together only by that context,
// not by any wrapping element an address could ever belong to.
//
// `ComponentPassport.root` must still name ONE real part, and the assembly mechanism
// (`checkAssembly`, `baseAssemblyOf`) can only ever describe ONE tree from ONE root — so a choice
// was made, not avoided: `positioner` is the part that actually, correctly CONTAINS the rest of
// what a popover visually IS (`content` — with `title`/`description`/`closeTrigger` inside it —
// and `arrow`, both real children of `positioner` in Ark's own documented composition). `trigger`
// and `anchor` are NOT nested under `positioner` in truth (they are its real DOM siblings), so
// they are deliberately NOT in `positioner`'s `accepts` (`playground/parts.ts`) — putting them
// there would make the assembly mechanism render a `<Trigger>` wrapping a `<Positioner>`, which
// does not match what `@ark-ui/solid` actually does. A working assembly built from this root can
// only show the floating half of a popover; `trigger` (and, rarer, `anchor`) has to be documented
// as existing OUTSIDE that tree, not nested within it — the passport model's tree shape has no
// field for "these two parts are siblings under an invisible provider," so this is named here as
// a real limitation, not solved by inventing one.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid and no Ark. Needed only so the setting keys are
// checked against the component's real props.
import type { PopoverProps } from "../components/index.js";
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

/** Passport of the popover — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  // See "There is NO `root` part" above: `positioner` stands in, deliberately, not by omission.
  root: "positioner",
  parts: [
    // No states: pure positioning, style only.
    { name: "arrow", states: [] },
    { name: "arrowTip", states: [] },
    // No states: identity/wiring only (`id`, `dir`) — no data attribute of any kind.
    { name: "anchor", states: [] },
    {
      name: "trigger",
      states: [
        open,
        closed,
        // Present only in a multi-trigger popover (`value` prop) — real either way, always
        // written as a boolean (`dataAttr(current)`).
        { name: "current", mark: { kind: "attribute", name: "data-current" } },
        // A genuine `<button>` with no JS-tracked pointer state — the browser gives these for
        // free, the same reasoning the plain button's passport already applies.
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "indicator", states: [open, closed] },
    {
      name: "positioner",
      states: [],
      variables: [
        { name: "--reference-width", setBy: "kit" },
        { name: "--reference-height", setBy: "kit" },
        { name: "--available-width", setBy: "kit" },
        { name: "--available-height", setBy: "kit" },
      ],
    },
    { name: "content", states: [open, closed] },
    { name: "title", states: [] },
    { name: "description", states: [] },
    {
      name: "closeTrigger",
      states: [
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `modal`/`portalled`/`autoFocus`/
  // `closeOnEscape`/`closeOnInteractOutside` are all real props, but none is
  // `orientation`/`multiple`/`collapsible` — `defineSettings`'s own `Extract<keyof Props,
  // PassportSettingName>` filters them out by construction, the same empty result the plain
  // button's and the switch's own settings already show.
  settings: defineSettings<PopoverProps>()({}),
});
