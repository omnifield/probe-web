// RUNTIME passport of the toggle group — anatomy (`anatomy.ts`) plus everything else the running
// app needs: per-part STATES, the variant axis, and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/toggle-group/toggle-group.connect.mjs`, the same rigor
// the rest of the kit's passports ask for.
//
// ## `item` is a genuine `<button>` — hover/active/focus-visible are PSEUDO, the button's own reasoning
//
// `getItemProps` (`normalize.button`) has NO `onPointerMove`/`onPointerLeave`/`onPointerDown` at
// all — unlike the checkbox's or the switch's root, nothing here tracks the pointer in JS. A real
// `<button>` gives hover/active/focus-visible for free, the same finding the plain button's own
// passport and the tabs' own trigger already make. `data-focus` is still real, machine-tracked
// data, not a pseudo — declared ALONGSIDE `:focus-visible`, exactly the tabs' trigger's own
// device: roving-tabindex focus management needs the machine's own concept of "which item is
// focused" (`context.get("focusedId")`), which a bare `:focus` pseudo cannot express (it would
// also fire on the container itself during initial tab-in).
//
// ## No form-validity states at all
//
// Unlike the checkbox/switch/radio group, `@zag-js/toggle-group` has no `invalid`/`required`/
// `readOnly` prop — `toggle-group.props.mjs`'s list stops at `disabled`/`multiple`/`orientation`/
// `rovingFocus`/`deselectable`. Nothing here participates in form validation, so nothing is
// declared for it — a checkable absence, not an oversight.
//
// ## `root` itself can receive real focus too, `data-focus` there is a SUMMARY, not that
//
// `getRootProps` sets `tabIndex`/`onFocus`/`onBlur` for the initial roving-tabindex tab-in, but
// its own `data-focus` mark is `context.get("focusedId") != null` — "some item in this set is
// focused", the exact same aggregate device the tabs' own `root`/`list` already use, not a literal
// reflection of focus landing on the root node itself.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { ToggleGroupProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Some item in this set is focused — an aggregate fact, real on `root` only in the tab-in case. */
const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;

/** The whole set is disabled, or (on `item`) this one item is — either its own prop or the group's. */
const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;

/** Passport of the toggle group — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [disabled, focus] },
    {
      name: "item",
      states: [
        { name: "on", mark: { kind: "attribute", name: "data-state", value: "on" } },
        { name: "off", mark: { kind: "attribute", name: "data-state", value: "off" } },
        disabled,
        focus,
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // Two settings from the closed vocabulary apply. `orientation` — same shape as the tabs'/
  // accordion's own, mark verified present on BOTH parts, default `"horizontal"`
  // (`toggle-group.machine.mjs`'s own `props()` default — checked live, not assumed).
  // `multiple` — same shape as the accordion's own: NO mark at all (`data-multiple` never appears
  // in `toggle-group.connect.mjs`), it only changes behavior (single- vs multi-press, and
  // `role="radiogroup"` vs `"group"` — an ARIA role, not a passport mark). `disabled` is excluded
  // the same way the checkbox excludes it: already a STATE above. `deselectable`/`rovingFocus` are
  // real zag props but outside the closed `SETTINGS` vocabulary (`orientation`/`multiple`/
  // `collapsible` only) — not modeled, the same way `loopFocus`/`ids` are not on any component.
  settings: defineSettings<ToggleGroupProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "horizontal" }, { value: "vertical" }],
      },
      byDefault: "horizontal",
      mark: { kind: "attribute", name: "data-orientation" },
    },
    multiple: {
      values: { kind: "flag" },
      byDefault: false,
    },
  }),
});
