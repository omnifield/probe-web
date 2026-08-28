// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY per-part taxonomy for the timer — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// WHAT IS REAL BELOW: every part key, every state key (matches `../entity/passport.ts` exactly —
// `defineEditorInfo` throws otherwise), and every `accepts` rule (mirrors the doc-comment example
// in `../components/index.tsx`: `root` wraps `area`(one `item` per time unit, `separator`s
// between them) + `control`(one `actionTrigger` per action)).
//
// WHAT IS A PLACEHOLDER: every `means: "TODO"` — human-facing prose, left for whoever fills the
// playground zone next. Replace each one; do not remove or rename a key while doing it, or
// `defineEditorInfo` will throw at build time (parts/states are checked against the passport
// EXACTLY, not a superset).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type TimerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const timePartMeans = {
  days: { means: "TODO" },
  hours: { means: "TODO" },
  minutes: { means: "TODO" },
  seconds: { means: "TODO" },
  milliseconds: { means: "TODO" },
} satisfies PassportPartEditorInfo<TimerPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "TODO" },
  "focus-visible": { means: "TODO" },
  active: { means: "TODO" },
} satisfies PassportPartEditorInfo<TimerPart>["states"];

export const parts: Readonly<Record<TimerPart, PassportPartEditorInfo<TimerPart>>> = {
  root: {
    means: "TODO",
    states: {},
    accepts: [
      { kind: "component", name: "area" },
      { kind: "component", name: "control" },
    ],
  },
  area: {
    means: "TODO",
    states: {},
    accepts: [
      { kind: "component", name: "item" },
      { kind: "component", name: "separator" },
    ],
  },
  control: {
    means: "TODO",
    states: {},
    accepts: [{ kind: "component", name: "actionTrigger" }],
  },
  item: {
    means: "TODO",
    states: timePartMeans,
    variables: {
      "--value": { means: "TODO" },
    },
    // Occupied — renders its own formatted value as text, no consumer content (`../components/index.tsx`).
    accepts: [],
  },
  itemLabel: {
    means: "TODO",
    states: timePartMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemValue: {
    means: "TODO",
    states: timePartMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  actionTrigger: {
    means: "TODO",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  separator: {
    means: "TODO",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
};
