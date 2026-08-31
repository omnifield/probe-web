// RUNTIME passport of the toast — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/toast/toast.connect.mjs` (121 lines) AND
// `toast-group.connect.mjs` (65 lines, `group`'s own connector — a SEPARATE file, `../entity/
// anatomy.ts` explains why), both read in full, the same rigor the rest of the kit's passports
// read from a `.connect.mjs`.
//
// ## `placement` splits into THREE separately-written attributes, not one
//
// `data-placement` (the full six-way value), `data-side` (`"top"`/`"bottom"`, the first half of
// the split), `data-align` (`"start"`/`"end"`, or `"center"` when the placement has no suffix —
// `const [side, align = "center"] = placement.split("-")`, checked on both `group`'s own connector
// AND `root`'s) are THREE real, independently-selectable marks derived from the SAME one prop
// (`placement: "top-start"|"top"|"top-end"|"bottom-start"|"bottom"|"bottom-end"`, `@zag-js/toast/
// toast.types.d.mts`) — a skin styling "every top toast, regardless of alignment" wants `data-
// side`, one styling "every centered toast, top or bottom" wants `data-align`; neither substitutes
// for the other, so both are declared alongside `data-placement` itself, not folded into it.
//
// ## `placement` cannot be a SETTING — configured on the STORE, not a per-instance prop, and the
// name would not qualify anyway
//
// `createToaster({ placement })` fixes it for the whole store, before any `Toaster`/`ToastRoot`
// ever mounts — there is no component instance whose own props it could be a setting OF.  Even if
// there were, `"placement"` is not one of the closed vocabulary's three names
// (`orientation`/`multiple`/`collapsible`) — the same wall the date picker's own `view` and the
// drawer's own `swipeDirection` already hit, here compounded by the store-level configuration on
// top.
//
// ## `data-type` is an OPEN five-way union, not closed the way every other multi-valued mark has been
//
// `Type = "success" | "error" | "loading" | "info" | "warning" | (string & {})` (checked in
// `toast.types.d.mts`, not assumed) — the FIVE well-known values are declared as named states
// below; the trailing `(string & {})` means a consumer can pass ANY string as a custom toast type,
// and `data-type` will carry it faithfully. A rule keyed on one of the five names will not catch
// every possible toast; this is named as a real, open-ended quality of the mark, not narrowed to
// pretend the union is closed.
//
// ## `data-first`/`data-sibling` and `data-stack`/`data-overlap` are two more opposite-polarity pairs
//
// `root` carries both members of each pair (`dataAttr(frontmost)`/`dataAttr(!frontmost)`,
// `dataAttr(stacked)`/`dataAttr(!stacked)`) — the same shape the avatar's own `visible`/`hidden`
// pair already has: one boolean fact, two named states with opposite polarity, both declared
// because a skin rule addresses "the frontmost toast" and "every toast BUT the frontmost" through
// two different names, not one name and its logical negation.
//
// ## `actionTrigger`/`closeTrigger` are genuine buttons with no JS-tracked pointer state
//
// Neither sets a single `data-*` mark of its own (only `onClick`) — `hover`/`focus-visible`/
// `active` are the only addressable facts either has, the plain button's own reasoning.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { ToasterProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Six placement values, shared by `group` and `root`. */
const topStart = { name: "top-start", mark: { kind: "attribute", name: "data-placement", value: "top-start" } } as const satisfies PassportState;
const top = { name: "top", mark: { kind: "attribute", name: "data-placement", value: "top" } } as const satisfies PassportState;
const topEnd = { name: "top-end", mark: { kind: "attribute", name: "data-placement", value: "top-end" } } as const satisfies PassportState;
const bottomStart = { name: "bottom-start", mark: { kind: "attribute", name: "data-placement", value: "bottom-start" } } as const satisfies PassportState;
const bottom = { name: "bottom", mark: { kind: "attribute", name: "data-placement", value: "bottom" } } as const satisfies PassportState;
const bottomEnd = { name: "bottom-end", mark: { kind: "attribute", name: "data-placement", value: "bottom-end" } } as const satisfies PassportState;
const placementStates: readonly PassportState[] = [topStart, top, topEnd, bottomStart, bottom, bottomEnd];

/** The vertical half of `placement` — its own attribute, addressable independently of alignment. */
const sideTop = { name: "side-top", mark: { kind: "attribute", name: "data-side", value: "top" } } as const satisfies PassportState;
const sideBottom = { name: "side-bottom", mark: { kind: "attribute", name: "data-side", value: "bottom" } } as const satisfies PassportState;

/** The horizontal half of `placement` — its own attribute, addressable independently of side. */
const alignStart = { name: "align-start", mark: { kind: "attribute", name: "data-align", value: "start" } } as const satisfies PassportState;
const alignCenter = { name: "align-center", mark: { kind: "attribute", name: "data-align", value: "center" } } as const satisfies PassportState;
const alignEnd = { name: "align-end", mark: { kind: "attribute", name: "data-align", value: "end" } } as const satisfies PassportState;

const positionStates: readonly PassportState[] = [...placementStates, sideTop, sideBottom, alignStart, alignCenter, alignEnd];

/** A genuine button with no JS-tracked pointer state — the plain button's own reasoning. */
const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

/** Passport of the toast — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "group", states: positionStates },
    {
      name: "root",
      states: [
        ...positionStates,
        { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } },
        { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } },
        // Five well-known values of an OPEN union — see the file header.
        { name: "success", mark: { kind: "attribute", name: "data-type", value: "success" } },
        { name: "error", mark: { kind: "attribute", name: "data-type", value: "error" } },
        { name: "loading", mark: { kind: "attribute", name: "data-type", value: "loading" } },
        { name: "info", mark: { kind: "attribute", name: "data-type", value: "info" } },
        { name: "warning", mark: { kind: "attribute", name: "data-type", value: "warning" } },
        { name: "mounted", mark: { kind: "attribute", name: "data-mounted" } },
        { name: "paused", mark: { kind: "attribute", name: "data-paused" } },
        { name: "first", mark: { kind: "attribute", name: "data-first" } },
        { name: "sibling", mark: { kind: "attribute", name: "data-sibling" } },
        { name: "stack", mark: { kind: "attribute", name: "data-stack" } },
        { name: "overlap", mark: { kind: "attribute", name: "data-overlap" } },
      ],
    },
    { name: "title", states: [] },
    { name: "description", states: [] },
    { name: "actionTrigger", states: buttonPseudos },
    { name: "closeTrigger", states: buttonPseudos },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `placement` is real but store-level and
  // ineligible by name (see the file header) — the same empty result the dialog's/drawer's own
  // settings already show.
  settings: defineSettings<ToasterProps>()({}),
});
