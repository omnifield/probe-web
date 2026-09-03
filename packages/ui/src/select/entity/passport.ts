import {
  defineSettings,
  definePassport,
  type PassportState,
} from "@omnifield/probe-web-skin/model";
import type { SelectProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;

const invalid = {
  name: "invalid",
  mark: { kind: "attribute", name: "data-invalid" },
} as const satisfies PassportState;

const readOnly = {
  name: "readonly",
  mark: { kind: "attribute", name: "data-readonly" },
} as const satisfies PassportState;

const required = {
  name: "required",
  mark: { kind: "attribute", name: "data-required" },
} as const satisfies PassportState;

const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [invalid, readOnly] },
    { name: "label", states: [disabled, invalid, readOnly, required] },
    { name: "control", states: [open, closed, focus, disabled, invalid] },
    { name: "valueText", states: [disabled, invalid, focus] },
    {
      name: "trigger",
      states: [
        open,
        closed,
        disabled,
        invalid,
        readOnly,
        { name: "placeholder", mark: { kind: "attribute", name: "data-placeholder-shown" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "clearTrigger",
      states: [
        invalid,
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "indicator", states: [open, closed, disabled, invalid, readOnly] },
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
    { name: "list", states: [] },
    { name: "itemGroup", states: [disabled] },
    { name: "itemGroupLabel", states: [] },
    {
      name: "item",
      states: [
        { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } },
        { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } },
        { name: "highlighted", mark: { kind: "attribute", name: "data-highlighted" } },
        disabled,
      ],
    },
    {
      name: "itemText",
      states: [
        { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } },
        { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } },
        { name: "highlighted", mark: { kind: "attribute", name: "data-highlighted" } },
        disabled,
      ],
    },
    {
      name: "itemIndicator",
      states: [
        { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } },
        { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<SelectProps>()({
    multiple: { values: { kind: "flag" }, byDefault: false },
  }),
});
