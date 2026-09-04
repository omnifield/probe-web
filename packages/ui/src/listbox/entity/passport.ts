import {
  defineSettings,
  definePassport,
  type PassportState,
} from "@web-core/skin/model";
import type { ListboxProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;

const empty = {
  name: "empty",
  mark: { kind: "attribute", name: "data-empty" },
} as const satisfies PassportState;

const checked = {
  name: "checked",
  mark: { kind: "attribute", name: "data-state", value: "checked" },
} as const satisfies PassportState;

const unchecked = {
  name: "unchecked",
  mark: { kind: "attribute", name: "data-state", value: "unchecked" },
} as const satisfies PassportState;

const highlighted = {
  name: "highlighted",
  mark: { kind: "attribute", name: "data-highlighted" },
} as const satisfies PassportState;

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [disabled] },
    { name: "label", states: [disabled] },
    { name: "input", states: [disabled] },
    { name: "content", states: [empty] },
    { name: "item", states: [checked, unchecked, highlighted, disabled] },
    { name: "itemText", states: [checked, unchecked, highlighted, disabled] },
    { name: "itemIndicator", states: [checked, unchecked] },
    { name: "itemGroup", states: [disabled, empty] },
    { name: "itemGroupLabel", states: [] },
    { name: "valueText", states: [disabled] },
    { name: "empty", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<ListboxProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "vertical" }, { value: "horizontal" }],
      },
      byDefault: "vertical",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  }),
});
