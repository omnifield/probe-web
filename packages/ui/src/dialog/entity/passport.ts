import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { DialogProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

const openClosed: readonly PassportState[] = [open, closed];

const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

export const passport = definePassport({
  anatomy,
  root: "positioner",
  parts: [
    {
      name: "trigger",
      states: [
        ...openClosed,
        { name: "current", mark: { kind: "attribute", name: "data-current" } },
        ...buttonPseudos,
      ],
    },
    { name: "backdrop", states: openClosed },
    { name: "positioner", states: [] },
    { name: "content", states: openClosed },
    { name: "title", states: [] },
    { name: "description", states: [] },
    { name: "closeTrigger", states: buttonPseudos },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<DialogProps>()({}),
});
