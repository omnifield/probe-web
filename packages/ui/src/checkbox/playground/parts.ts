// EDITOR-ONLY per-part taxonomy for the checkbox — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-115`/`PWEB-118`, split out `PWEB-127`). Means, states, and nesting — the taxonomy
// half of the editor slice; scenario data (`assemblies.ts`) is the other, split out the same way:
// the same physical shape as every other component's `playground/`.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

// The literal part-name union, read off the passport itself — see `assemblies.ts` for the same
// device and the same reason (no contextual typing reaches into a separate module).
type CheckboxPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const sharedStates = {
  checked: { means: "the checkbox is checked" },
  unchecked: { means: "the checkbox is unchecked" },
  indeterminate: { means: "partially checked — typically a checkbox summarizing partially-checked children" },
  disabled: { means: "the checkbox is disabled — it cannot be toggled" },
  readonly: { means: "the checkbox is read-only — its state is visible but cannot be toggled" },
  invalid: { means: "the checkbox is invalid per the form's validation rules" },
  required: { means: "the checkbox is required for form submission" },
  hover: { means: "the pointer is over the checkbox" },
  active: { means: "the checkbox is being pressed by the pointer" },
  focus: { means: "focus is on the checkbox" },
  "focus-visible": { means: "focus arrived from the keyboard — a focus ring belongs here" },
} as const;

export const parts: Readonly<Record<CheckboxPart, PassportPartEditorInfo<CheckboxPart>>> = {
  root: {
    means: "the checkbox as a whole — a `<label>` node; clicking it toggles the mark",
    states: sharedStates,
    // The label and control are placed inside by the consumer; the root accepts three parts
    // of its own — control, indicator (nested inside control by Ark's real markup, but the
    // passport states nesting as ALLOWED, not as the one true structure — the same device as
    // the accordion) and label.
    accepts: [
      { kind: "component", name: "control" },
      { kind: "component", name: "indicator" },
      { kind: "component", name: "label" },
      { kind: "content", genus: "text" },
      { kind: "component" },
      // The real hidden `<input type="checkbox">` (`PWEB-152`) — the node the actual
      // `onChange` lives on; without it the preview looks right but a click toggles nothing.
      { kind: "component", name: "hiddenInput" },
    ],
  },
  control: {
    means: "the control frame — the visible square that holds the checked-mark indicator",
    states: sharedStates,
    accepts: [
      { kind: "component", name: "indicator" },
      { kind: "content", genus: "icon" },
      { kind: "component" },
    ],
  },
  indicator: {
    means: "the checked-mark indicator — a check or a dash, placed by the consumer",
    states: sharedStates,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  label: {
    means: "the checkbox's label",
    states: sharedStates,
    accepts: [{ kind: "content", genus: "text" }],
  },
};
