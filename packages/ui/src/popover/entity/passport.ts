import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { PopoverProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

export const passport = definePassport({
  anatomy,
  root: "positioner",
  parts: [
    { name: "arrow", states: [] },
    { name: "arrowTip", states: [] },
    { name: "anchor", states: [] },
    {
      name: "control",
      states: [
        open,
        closed,
        { name: "current", mark: { kind: "attribute", name: "data-current" } },
        ...buttonPseudos,
      ],
    },
    { name: "controlIndicator", states: [open, closed] },
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
    { name: "content", states: [open, closed] },
    { name: "title", states: [] },
    { name: "description", states: [] },
    { name: "closeTrigger", states: buttonPseudos },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<PopoverProps>()({}),
});
