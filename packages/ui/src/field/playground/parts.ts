// EDITOR-ONLY per-part taxonomy for the field — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`).
//
// `select`'s `accepts` stays UNDECLARED, as the template left it — a native `<select>` needs real
// `<option>` children, and the kit's content-genus vocabulary has no place for one yet.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type FieldPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

// The shared state-name/`means` dictionary for the three native control renderers.
const controlStateMeans = {
  invalid: { means: "the enclosing form rejected the value" },
  required: { means: "the form will demand a value on submit" },
  readonly: { means: "the value is visible, changing it is not possible" },
  disabled: { means: "this control cannot be used" },
  hover: { means: "pointer is over this control" },
  focus: { means: "this control has keyboard or pointer focus" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
} satisfies PassportPartEditorInfo<FieldPart>["states"];

export const parts: Readonly<Record<FieldPart, PassportPartEditorInfo<FieldPart>>> = {
  root: {
    means: "the whole field — label, control, helper/error text and required marker, wired into one addressable, accessible group",
    states: {
      disabled: { means: "the whole field is disabled" },
      invalid: { means: "the enclosing form rejected the value" },
      readonly: { means: "the value is visible, changing it is not possible" },
    },
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "input" },
      { kind: "component", name: "select" },
      { kind: "component", name: "textarea" },
      { kind: "component", name: "helperText" },
      { kind: "component", name: "errorText" },
      { kind: "component", name: "requiredIndicator" },
      { kind: "component" },
    ],
  },
  label: {
    means: "the field's own label",
    states: {
      disabled: { means: "the whole field is disabled" },
      invalid: { means: "the enclosing form rejected the value" },
      readonly: { means: "the value is visible, changing it is not possible" },
      required: { means: "the form will demand a value on submit" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component", name: "requiredIndicator" },
    ],
  },
  input: {
    means: "a plain text control wired to the field — one of three interchangeable renderers",
    states: controlStateMeans,
    accepts: [],
  },
  // `accepts` intentionally undeclared — see file header.
  select: {
    means: "a plain native dropdown control wired to the field — one of three interchangeable renderers",
    states: controlStateMeans,
  },
  textarea: {
    means: "a plain multi-line text control wired to the field — one of three interchangeable renderers",
    states: controlStateMeans,
    accepts: [],
  },
  helperText: {
    means: "hint text — stays mounted regardless of validity",
    states: { disabled: { means: "the whole field is disabled" } },
    accepts: [{ kind: "content", genus: "text" }],
  },
  errorText: {
    means: "the validation message — mounted only while the field is invalid",
    accepts: [{ kind: "content", genus: "text" }],
  },
  requiredIndicator: {
    means: "the required marker — mounted only while the field is required; defaults to \"*\"",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
