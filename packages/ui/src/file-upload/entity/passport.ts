import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
import type { FileUploadProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;
const readOnly = { name: "readonly", mark: { kind: "attribute", name: "data-readonly" } } as const satisfies PassportState;

const accepted = { name: "accepted", mark: { kind: "attribute", name: "data-type", value: "accepted" } } as const satisfies PassportState;
const rejected = { name: "rejected", mark: { kind: "attribute", name: "data-type", value: "rejected" } } as const satisfies PassportState;
const itemTypeStates: readonly PassportState[] = [accepted, rejected];

const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [disabled, readOnly, { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } }],
    },
    {
      name: "dropzone",
      states: [
        disabled,
        readOnly,
        { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } },
        { name: "invalid", mark: { kind: "attribute", name: "data-invalid" } },
      ],
    },
    { name: "label", states: [disabled, { name: "required", mark: { kind: "attribute", name: "data-required" } }] },
    {
      name: "trigger",
      states: [disabled, readOnly, { name: "invalid", mark: { kind: "attribute", name: "data-invalid" } }, ...buttonPseudos],
    },
    { name: "clearTrigger", states: [disabled, readOnly, ...buttonPseudos] },
    { name: "itemGroup", states: [disabled, ...itemTypeStates] },
    { name: "item", states: [disabled, ...itemTypeStates] },
    { name: "itemName", states: [disabled, ...itemTypeStates] },
    { name: "itemSizeText", states: [disabled, ...itemTypeStates] },
    { name: "itemPreview", states: [disabled, ...itemTypeStates] },
    { name: "itemPreviewImage", states: [disabled, ...itemTypeStates] },
    { name: "itemDeleteTrigger", states: [disabled, readOnly, ...itemTypeStates, ...buttonPseudos] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<FileUploadProps>()({}),
});
