import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { ToggleProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const on = { name: "on", mark: { kind: "attribute", name: "data-state", value: "on" } } as const satisfies PassportState;
const off = { name: "off", mark: { kind: "attribute", name: "data-state", value: "off" } } as const satisfies PassportState;
const pressed = { name: "pressed", mark: { kind: "attribute", name: "data-pressed" } } as const satisfies PassportState;
const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;

const sharedStates: readonly PassportState[] = [on, off, pressed, disabled];

const rootPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [...sharedStates, ...rootPseudos] },
    { name: "indicator", states: sharedStates },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<ToggleProps>()({}),
});
