// RUNTIME passport of the timer — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/timer/timer.connect.mjs` (109 lines, read in full),
// the same rigor the rest of the kit's passports read from a `.connect.mjs`.
//
// ## `running`/`paused` are NEVER written as a `data-*` attribute anywhere in this connector
//
// The API returns `running`/`paused` as plain booleans (`connect`'s own return value), but NOT
// ONE `getXxxProps` function spreads either onto any part — checked across all eight. A skin
// cannot key a rule on "the timer is running" through any attribute at all; the only externally
// visible trace is `actionTrigger`'s own native `hidden` (which action buttons show/hide), and
// that has no substitute address either — the same honest absence the file upload's own
// `clearTrigger` already names, not invented here to fill a gap.
//
// ## `root`/`area`/`control`/`separator` carry NO marks of any kind
//
// `getRootProps`/`getAreaProps`/`getControlProps`/`getSeparatorProps` set only `id`/`role`/
// `aria-*`/the anatomy address itself — no `data-*` anywhere. Four of the eight parts are simply
// bare, a checkable fact, not a placeholder.
//
// ## `item` carries a real, measured `--value` — the raw number behind the formatted text
//
// `getItemProps` sets `style: { "--value": value }` where `value = time[props.type]` — the actual
// numeric count for that time unit (e.g. `42` for seconds), not a position/size hint the way
// every other kit component's own variables have been. A skin can read it for a counter-style or
// clip-path effect; declared the same way any other kit-written custom property is.
//
// ## `item`/`itemLabel`/`itemValue` share ONE five-valued `data-type` — which time unit this is
//
// `TimePart` (`@zag-js/timer/timer.types.d.mts`) is exactly `"days"|"hours"|"minutes"|"seconds"|
// "milliseconds"` — checked against the actual interface, not guessed from the common four-part
// case. The same "one shared attribute, several real values" shape the date picker's own `view`
// and the menu's own item `type` already use.
//
// ## `actionTrigger` is a genuine button with no JS-tracked pointer state
//
// `getActionTriggerProps` sets no `data-*` mark of its own at all (only the native `hidden`
// above) — `hover`/`focus-visible`/`active` are the only addressable facts it has, the plain
// button's own reasoning.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { TimerProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** Which time unit this is — shared by `item`/`itemLabel`/`itemValue`. */
const days: PassportState = { name: "days", mark: { kind: "attribute", name: "data-type", value: "days" } };
const hours: PassportState = { name: "hours", mark: { kind: "attribute", name: "data-type", value: "hours" } };
const minutes: PassportState = { name: "minutes", mark: { kind: "attribute", name: "data-type", value: "minutes" } };
const seconds: PassportState = { name: "seconds", mark: { kind: "attribute", name: "data-type", value: "seconds" } };
const milliseconds: PassportState = {
  name: "milliseconds",
  mark: { kind: "attribute", name: "data-type", value: "milliseconds" },
};
const timePartStates: readonly PassportState[] = [days, hours, minutes, seconds, milliseconds];

/** A genuine button with no JS-tracked pointer state — the plain button's own reasoning. */
const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

/** Passport of the timer — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "area", states: [] },
    { name: "control", states: [] },
    {
      name: "item",
      states: timePartStates,
      variables: [{ name: "--value", setBy: "kit" }],
    },
    { name: "itemLabel", states: timePartStates },
    { name: "itemValue", states: timePartStates },
    { name: "actionTrigger", states: buttonPseudos },
    { name: "separator", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `countdown`/`autoStart`/`interval`/`startMs`/
  // `targetMs` are all real props, but none is `orientation`/`multiple`/`collapsible` — the same
  // empty result the dialog's/drawer's own settings already show.
  settings: defineSettings<TimerProps>({}),
});
