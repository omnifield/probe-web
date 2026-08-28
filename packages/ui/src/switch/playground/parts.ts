// EDITOR-ONLY per-part taxonomy for the switch — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type SwitchPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

// The shared state-name/`means` dictionary is identical on all four parts (`../entity/
// passport.ts`'s `states`, spread from ONE `dataAttrs` object) — written once here and reused,
// so a filled-in "TODO" cannot drift between root/control/thumb/label independently.
const stateMeans = {
  checked: { means: "the switch is on" },
  unchecked: { means: "the switch is off" },
  disabled: { means: "the switch cannot be toggled" },
  readonly: { means: "the value is visible, toggling it is not possible" },
  invalid: { means: "the enclosing form rejected the value" },
  required: { means: "the form will demand a value on submit" },
  hover: { means: "pointer is over the switch (tracked by the machine, not the browser — the root is a label, not natively hoverable as a control)" },
  active: { means: "the switch is being pressed" },
  focus: { means: "keyboard or pointer focus is on the hidden input — mirrored here since none of the visible parts can receive focus themselves" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
} satisfies PassportPartEditorInfo<SwitchPart>["states"];

export const parts: Readonly<Record<SwitchPart, PassportPartEditorInfo<SwitchPart>>> = {
  root: {
    means: "the whole switch — a label wrapping the track and its own text",
    states: stateMeans,
    accepts: [
      { kind: "component", name: "control" },
      { kind: "component", name: "label" },
      // The real hidden `<input type="checkbox">` (`PWEB-152`) — the node the real `onChange`
      // lives on; without it a preview looks right but a click never toggles the switch.
      { kind: "component", name: "hiddenInput" },
    ],
  },
  control: {
    means: "the track — the visible background the thumb slides across",
    states: stateMeans,
    accepts: [{ kind: "component", name: "thumb" }],
  },
  thumb: {
    means: "the moving indicator — slides to one end of the track or the other",
    states: stateMeans,
    // Occupied — Ark's own usage example self-closes it, no content nested inside.
    accepts: [],
  },
  label: {
    means: "the switch's own text",
    states: stateMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
};
