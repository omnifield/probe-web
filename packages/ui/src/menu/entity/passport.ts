import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { MenuProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const open = { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } } as const satisfies PassportState;
const closed = { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } } as const satisfies PassportState;
const openClosed: readonly PassportState[] = [open, closed];

const current = { name: "current", mark: { kind: "attribute", name: "data-current" } } as const satisfies PassportState;

const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;
const highlighted = { name: "highlighted", mark: { kind: "attribute", name: "data-highlighted" } } as const satisfies PassportState;

const checked = { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } } as const satisfies PassportState;
const unchecked = { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } } as const satisfies PassportState;
const optionStates: readonly PassportState[] = [checked, unchecked];

export const passport = definePassport({
  anatomy,
  root: "positioner",
  parts: [
    { name: "arrow", states: [] },
    { name: "arrowTip", states: [] },
    {
      name: "positioner",
      states: [],
      variables: [
        { name: "--reference-width", setBy: "kit" },
        { name: "--reference-height", setBy: "kit" },
        { name: "--available-width", setBy: "kit" },
        { name: "--available-height", setBy: "kit" },
      ],
    },
    { name: "content", states: openClosed },
    { name: "indicator", states: openClosed },
    { name: "trigger", states: [...openClosed, current, ...buttonPseudos] },
    { name: "triggerItem", states: [...openClosed, disabled, highlighted] },
    { name: "contextTrigger", states: [...openClosed, current] },
    { name: "separator", states: [] },
    { name: "itemGroup", states: [] },
    { name: "itemGroupLabel", states: [] },
    {
      name: "item",
      states: [
        disabled,
        highlighted,
        ...optionStates,
        { name: "radio", mark: { kind: "attribute", name: "data-type", value: "radio" } },
        { name: "checkbox", mark: { kind: "attribute", name: "data-type", value: "checkbox" } },
      ],
    },
    { name: "itemIndicator", states: [disabled, highlighted, ...optionStates] },
    { name: "itemText", states: [disabled, highlighted, ...optionStates] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<MenuProps>()({}),
});
