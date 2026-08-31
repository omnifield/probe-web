// EDITOR-ONLY per-part taxonomy for the toggle — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// Every part key, every state key (matches `../entity/passport.ts` exactly — `defineEditorInfo`
// throws otherwise), and every `accepts` rule (mirrors the actual Solid nesting: `root` wraps
// `indicator`, the only child) is real.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type TogglePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const sharedMeans = {
  on: { means: "the toggle is pressed" },
  off: { means: "the toggle is not pressed" },
  pressed: { means: "the toggle is pressed — the same fact as `on`, encoded as presence rather than a two-valued attribute" },
  disabled: { means: "the toggle is disabled — it cannot be pressed" },
} satisfies PassportPartEditorInfo<TogglePart>["states"];

export const parts: Readonly<Record<TogglePart, PassportPartEditorInfo<TogglePart>>> = {
  root: {
    means: "the toggle as a whole — a single `<button aria-pressed>`, wraps `indicator`",
    states: sharedMeans,
    accepts: [{ kind: "component", name: "indicator" }],
  },
  indicator: {
    means: "the glyph shown inside the button — an icon, a checkmark, whatever the consumer puts inside it",
    states: sharedMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
