// EDITOR-ONLY per-part taxonomy for the timer — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// Every part key, every state key (matches `../entity/passport.ts` exactly — `defineEditorInfo`
// throws otherwise), and every `accepts` rule (mirrors the doc-comment example in
// `../components/index.tsx`: `root` wraps `area`(one `item` per time unit, `separator`s between
// them) + `control`(one `actionTrigger` per action)) is real.

import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type TimerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const timePartMeans = {
  days: { means: "this is the days unit" },
  hours: { means: "this is the hours unit" },
  minutes: { means: "this is the minutes unit" },
  seconds: { means: "this is the seconds unit" },
  milliseconds: { means: "this is the milliseconds unit" },
} satisfies PassportPartEditorInfo<TimerPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "pointer is over this button" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
  active: { means: "this button is being held down" },
} satisfies PassportPartEditorInfo<TimerPart>["states"];

export const parts: Readonly<Record<TimerPart, PassportPartEditorInfo<TimerPart>>> = {
  root: {
    means: "the timer as a whole — holds the count and the start/pause/reset actions",
    states: {},
    accepts: [
      { kind: "component", name: "area" },
      { kind: "component", name: "control" },
    ],
  },
  area: {
    means: "wraps the time-unit display — announces changes to assistive tech",
    states: {},
    accepts: [
      { kind: "component", name: "item" },
      { kind: "component", name: "separator" },
    ],
  },
  control: {
    means: "wraps the action buttons (start, pause, resume, reset, restart)",
    states: {},
    accepts: [{ kind: "component", name: "actionTrigger" }],
  },
  item: {
    means: "one time unit — renders its own formatted value as text (e.g. \"05\")",
    states: timePartMeans,
    variables: {
      "--value": { means: "the raw numeric count behind the formatted text (e.g. `5`, not `\"05\"`)" },
    },
    // Occupied — renders its own formatted value as text, no consumer content (`../components/index.tsx`).
    accepts: [],
  },
  itemLabel: {
    means: "one time unit's own label (e.g. \"min\") — content is the consumer's",
    states: timePartMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemValue: {
    means: "one time unit's own numeric value, decomposed from `item`'s all-in-one text — content is the consumer's",
    states: timePartMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  actionTrigger: {
    means: "one action button (start, pause, resume, reset, or restart) — hidden by the kit while its action doesn't apply",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  separator: {
    means: "between two time units (e.g. the \":\" in \"05:30\")",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
};
