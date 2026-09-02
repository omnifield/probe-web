import {
  defineSettings,
  definePassport,
  type PassportState,
} from "@omnifield/probe-web-skin/model";
import type { AccordionProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;

const openContent = {
  ...open,
  absentWhen:
    "the item expanded WITHOUT animation: Zag's collapsible drops `data-state` entirely " +
    "(`skip = !initial && open`), and an item expanded from the very start has no mark at all",
} as const satisfies PassportState;

const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "item", states: [open, disabled, focus] },
    {
      name: "control",
      states: [
        open,
        focus,
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        {
          name: "focus-visible",
          mark: { kind: "pseudo", name: ":focus-visible" },
        },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "controlIndicator", states: [open, disabled, focus] },
    {
      name: "content",
      states: [openContent, closed, disabled, focus],
      variables: [
        { name: "--height", setBy: "kit" },
        { name: "--width", setBy: "kit" },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<AccordionProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "vertical" }, { value: "horizontal" }],
      },
      byDefault: "vertical",
      mark: { kind: "attribute", name: "data-orientation" },
    },
    multiple: {
      values: { kind: "flag" },
      byDefault: false,
    },
    collapsible: {
      values: { kind: "flag" },
      byDefault: false,
      dependsOn: { on: "multiple", redundantWhen: true },
    },
  }),
});
