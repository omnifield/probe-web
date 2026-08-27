// EDITOR-ONLY per-part taxonomy for the toggle group — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type ToggleGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<ToggleGroupPart, PassportPartEditorInfo<ToggleGroupPart>>> = {
  root: {
    means: "the whole row (or column) of buttons",
    states: {
      disabled: { means: "the whole set is disabled — no item can be pressed" },
      focus: { means: "some item in this set is focused" },
    },
    accepts: [{ kind: "part", name: "item" }],
  },
  item: {
    means: "one button — press it to toggle on/off",
    states: {
      on: { means: "this button is pressed" },
      off: { means: "this button is not pressed" },
      disabled: { means: "this button cannot be pressed — its own flag, or the whole group's" },
      focus: { means: "the roving-tabindex machine considers this item the focused one" },
      "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
      hover: { means: "pointer is over this button" },
      active: { means: "this button is being held down" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
