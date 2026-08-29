// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY per-part taxonomy for tabs — read by `./index.ts`'s `defineEditorInfo` call. Same
// physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// WHAT IS REAL BELOW: every part key, every state key (matches `../entity/passport.ts` exactly —
// `defineEditorInfo` throws otherwise), and every `accepts` rule (mirrors Ark's own documented
// composition: `root` wraps `list` + one `content` per tab, `list` wraps `trigger` + `indicator`
// — the indicator shares the list's positioning context, it does not sit inside `root` directly).
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

type TabsPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<TabsPart, PassportPartEditorInfo<TabsPart>>> = {
  root: {
    means: "the whole set — the row of tabs together with the panel that's currently showing",
    states: { focus: { means: "some trigger in this set is focused" } },
    accepts: [
      { kind: "component", name: "list" },
      { kind: "component", name: "content" },
    ],
  },
  list: {
    means: "the row (or column) of tabs — wraps every trigger plus the sliding indicator",
    states: { focus: { means: "some trigger in this list is focused" } },
    accepts: [
      { kind: "component", name: "trigger" },
      { kind: "component", name: "indicator" },
    ],
  },
  trigger: {
    means: "one tab's button — switches to its panel when activated",
    states: {
      selected: { means: "this tab is the one currently showing" },
      disabled: { means: "this tab cannot be selected" },
      focus: { means: "keyboard or pointer focus is on this tab" },
      hover: { means: "pointer is over this tab" },
      "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
      active: { means: "this tab is being held down" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  content: {
    means: "one tab's panel — the content that shows while its tab is selected",
    states: { selected: { means: "this panel's own tab is selected — the panel is visible" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  indicator: {
    means: "the sliding marker under (or beside) whichever tab is selected — a plain box, no graphic of its own",
    variables: {
      "--left": { means: "measured horizontal position of the selected tab" },
      "--top": { means: "measured vertical position of the selected tab" },
      "--width": { means: "measured width of the selected tab" },
      "--height": { means: "measured height of the selected tab" },
    },
    // Occupied — a pure positioning box, no consumer content in Ark's own documented usage.
    accepts: [],
  },
};
