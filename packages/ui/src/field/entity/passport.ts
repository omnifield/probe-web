// RUNTIME passport of the field — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@ark-ui/solid`'s own `use-field.ts` (`getRootProps`,
// `getLabelProps`, `getInputProps`/`getSelectProps`/`getTextareaProps`, `getHelperTextProps`,
// `getErrorTextProps`) — there is no `@zag-js/field` connector to read instead (`entity/
// anatomy.ts` explains why), so this IS the ground truth for the field, the same rigor the rest
// of the kit's passports read from a `.connect.mjs`.
//
// ## `disabled`/`invalid`/`required`/`readonly` do NOT all land on every part — read, not assumed
//
// `root` carries `disabled`/`invalid`/`readonly` — NOT `required` (`getRootProps` never sets
// `data-required`). `label` carries all four. `input`/`select`/`textarea` carry `invalid`/
// `required`/`readonly` as DATA, and `disabled` only as the NATIVE HTML attribute (no
// `data-disabled` in `getInputProps` et al. — the same asymmetry the select's own `clearTrigger`
// has, and the same resolution: the mark that is actually emitted is the one declared).
// `helperText` carries `disabled` ALONE. `errorText`/`requiredIndicator` carry no mark at all —
// both are CONDITIONALLY MOUNTED, not conditionally styled: Ark's own `field-error-text.tsx`
// wraps it in `<Show when={invalid}>`, `field-required-indicator.tsx` in `<Show when=
// {required}>`. Neither node exists in the DOM at all while its condition is false, so there is
// no attribute left to vary once either one IS mounted — the same category of fact as an
// undeclared `hidden` elsewhere in the kit, one level further: not merely hidden, absent.
//
// ## `input`/`select`/`textarea` are genuine native elements — pseudo-classes are honest here
//
// Unlike the switch or the checkbox (custom widgets built from non-native nodes, needing Zag to
// track pointer/focus itself and mirror it as data), the field's three control renderers ARE
// plain `<input>`/`<select>`/`<textarea>` with no JS-tracked interaction state at all (`use-
// field.ts` sets no `onPointerMove`/`onFocus` on any of them) — the browser gives `:hover`/
// `:focus`/`:focus-visible` for free, the same reasoning the button's own passport already
// applies to its native `<button>`. `:active` is left OUT for these three: a text-entry or
// selection control is not a press-styled surface the way a button is, and there is no ground
// truth (Ark sets no press handling here either) to justify declaring it.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { FieldProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** Disabled — the field (or its enclosing fieldset) is disabled. */
const disabled: PassportState = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
};

/** Invalid — the form rejected the value; the field cannot say why, only that. */
const invalid: PassportState = {
  name: "invalid",
  mark: { kind: "attribute", name: "data-invalid" },
};

/** Read-only — the value is visible, changing it is not possible. */
const readOnly: PassportState = {
  name: "readonly",
  mark: { kind: "attribute", name: "data-readonly" },
};

/** Required — the form will demand a value on submit. */
const required: PassportState = {
  name: "required",
  mark: { kind: "attribute", name: "data-required" },
};

/** Shared dictionary for the three native control renderers — identical marks on all three. */
const controlStates: readonly PassportState[] = [
  invalid,
  required,
  readOnly,
  // Native ONLY: `getInputProps`/`getSelectProps`/`getTextareaProps` never write `data-disabled`
  // (unlike `root`/`label`), only the real `disabled` HTML attribute.
  { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus", mark: { kind: "pseudo", name: ":focus" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
];

/** Passport of the field — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    // No `required` here: `getRootProps` never writes `data-required` — only `label` and the
    // three control renderers do.
    { name: "root", states: [disabled, invalid, readOnly] },
    { name: "label", states: [disabled, invalid, readOnly, required] },
    { name: "input", states: controlStates },
    { name: "select", states: controlStates },
    { name: "textarea", states: controlStates },
    // `disabled` ALONE — `getHelperTextProps` sets nothing else.
    { name: "helperText", states: [disabled] },
    // No states: conditionally MOUNTED (see file header), not conditionally styled.
    { name: "errorText", states: [] },
    { name: "requiredIndicator", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `disabled`/`invalid`/`readOnly`/`required` are
  // already declared as STATES above (a form fact, not a look an author picks), and the field has
  // no `orientation`/`multiple`/`collapsible` prop for the other three names to attach to.
  settings: defineSettings<FieldProps>({}),
});
