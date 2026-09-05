import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { ToggleGroupProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;

const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [disabled, focus] },
    {
      name: "item",
      states: [
        { name: "on", mark: { kind: "attribute", name: "data-state", value: "on" } },
        { name: "off", mark: { kind: "attribute", name: "data-state", value: "off" } },
        disabled,
        focus,
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<ToggleGroupProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "horizontal" }, { value: "vertical" }],
      },
      byDefault: "horizontal",
      mark: { kind: "attribute", name: "data-orientation" },
    },
    multiple: {
      values: { kind: "flag" },
      byDefault: false,
    },
  }),
});
