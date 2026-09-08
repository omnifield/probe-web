import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { ToastProps } from "../components/index.js";
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
  root: "group",
  parts: [
    { name: "group", states: [] },
    {
      name: "root",
      states: [open, closed],
      variables: [
        { name: "--x", setBy: "kit" },
        { name: "--y", setBy: "kit" },
        { name: "--scale", setBy: "kit" },
        { name: "--z-index", setBy: "kit" },
        { name: "--height", setBy: "kit" },
        { name: "--opacity", setBy: "kit" },
        { name: "--gap", setBy: "kit" },
      ],
    },
    { name: "title", states: [] },
    { name: "description", states: [] },
    { name: "closeTrigger", states: buttonPseudos },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<ToastProps>()({}),
});
