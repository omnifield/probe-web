// RUNTIME passport of the switch — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/switch/switch.connect.mjs`, the same rigor the rest of
// the kit's passports ask for. `root`/`label`/`control`/`thumb` all spread the SAME `dataAttrs`
// object — the switch's state is visible whole on every one of its four addressable nodes, not
// by part, exactly the device the checkbox's own passport already names for its own four parts.
//
// Real DOM focus lives on the hidden `<input>`, not on any of the four visible parts — none of
// them can receive focus themselves — and Zag mirrors it as `data-focus`/`data-focus-visible`
// data, the same finding the checkbox's passport already makes for its own hidden input.
// Likewise hover/active: `onPointerMove`/`onPointerLeave` sit on `root` (a `<label>`, not
// natively hoverable as a control), so hover and active are data here too, never pseudo-classes —
// the same reasoning, not a coincidence, since a switch's root is a label wrapping the same kind
// of native input a checkbox's root is.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { SwitchProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** Checked — the switch is on. */
const checked: PassportState = {
  name: "checked",
  mark: { kind: "attribute", name: "data-state", value: "checked" },
};

/** Unchecked — the same attribute, the other value. Always one or the other. */
const unchecked: PassportState = {
  name: "unchecked",
  mark: { kind: "attribute", name: "data-state", value: "unchecked" },
};

/** Disabled — data, not native `:disabled`: `root` is a `<label>`, `control`/`thumb` are `<span>`s. */
const disabled: PassportState = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
};

/** Read-only — the value is visible, toggling it is not possible. */
const readOnly: PassportState = {
  name: "readonly",
  mark: { kind: "attribute", name: "data-readonly" },
};

/** Invalid — the enclosing form rejected the value; the switch cannot say why, only that. */
const invalid: PassportState = {
  name: "invalid",
  mark: { kind: "attribute", name: "data-invalid" },
};

/** Required — the form will demand a value on submit. */
const required: PassportState = {
  name: "required",
  mark: { kind: "attribute", name: "data-required" },
};

/** Hover — Zag tracks the pointer itself on `root` (`onPointerMove`/`onPointerLeave`), not the browser. */
const hover: PassportState = {
  name: "hover",
  mark: { kind: "attribute", name: "data-hover" },
};

/** Active — the switch is being pressed. Data, same reasoning as hover. */
const active: PassportState = {
  name: "active",
  mark: { kind: "attribute", name: "data-active" },
};

/** Focus, MIRRORED from the hidden input's real DOM focus onto parts that cannot receive it themselves. */
const focus: PassportState = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
};

/** Keyboard focus — the same mirrored device, a separate name: `:focus-visible` would aim at nothing. */
const focusVisible: PassportState = {
  name: "focus-visible",
  mark: { kind: "attribute", name: "data-focus-visible" },
};

/** Shared dictionary — by reference, so the four parts cannot drift from one another silently. */
const states: readonly PassportState[] = [
  checked,
  unchecked,
  disabled,
  readOnly,
  invalid,
  required,
  hover,
  active,
  focus,
  focusVisible,
];

/**
 * Passport of the switch — anatomy plus what anatomy alone does not say.
 *
 * Root is `label`: clicking the label toggles the switch the same way clicking a checkbox's
 * label does — Zag normalizes `getRootProps()` onto exactly that element.
 */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states },
    { name: "control", states },
    { name: "thumb", states },
    { name: "label", states },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `disabled`/`invalid`/`readOnly`/`required` are
  // already declared as STATES above (a form fact, not a look an author picks), and the switch
  // has no `orientation`/`multiple`/`collapsible` prop for the other three names to attach to —
  // the same empty result the plain button and the icon already declare.
  settings: defineSettings<SwitchProps>({}),
});
