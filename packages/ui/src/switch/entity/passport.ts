import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { SwitchProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const checked = { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } } as const satisfies PassportState;
const unchecked = { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } } as const satisfies PassportState;
const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;
const readOnly = { name: "readonly", mark: { kind: "attribute", name: "data-readonly" } } as const satisfies PassportState;
const invalid = { name: "invalid", mark: { kind: "attribute", name: "data-invalid" } } as const satisfies PassportState;
const required = { name: "required", mark: { kind: "attribute", name: "data-required" } } as const satisfies PassportState;
const hover = { name: "hover", mark: { kind: "attribute", name: "data-hover" } } as const satisfies PassportState;
const active = { name: "active", mark: { kind: "attribute", name: "data-active" } } as const satisfies PassportState;
const focus = { name: "focus", mark: { kind: "attribute", name: "data-focus" } } as const satisfies PassportState;
const focusVisible = { name: "focus-visible", mark: { kind: "attribute", name: "data-focus-visible" } } as const satisfies PassportState;

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
  settings: defineSettings<SwitchProps>()({}),
});
