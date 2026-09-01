import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";

import type { TreeNode, TreeRootProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const focus = { name: "focus", mark: { kind: "attribute", name: "data-focus" } } as const satisfies PassportState;
const selected = { name: "selected", mark: { kind: "attribute", name: "data-selected" } } as const satisfies PassportState;
const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;
const renaming = { name: "renaming", mark: { kind: "attribute", name: "data-renaming" } } as const satisfies PassportState;
const checked = { name: "checked", mark: { kind: "attribute", name: "data-checked" } } as const satisfies PassportState;
const indeterminate = { name: "indeterminate", mark: { kind: "attribute", name: "data-indeterminate" } } as const satisfies PassportState;
const loading = { name: "loading", mark: { kind: "attribute", name: "data-loading" } } as const satisfies PassportState;
const open = { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } } as const satisfies PassportState;
const closed = { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } } as const satisfies PassportState;
const openClosed: readonly PassportState[] = [open, closed];

const hoverActivePseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    {
      name: "item",
      states: [focus, selected, disabled, renaming, checked, indeterminate, loading, ...openClosed],
      variables: [{ name: "--depth", setBy: "kit" }],
    },
    {
      name: "itemControl",
      states: [...openClosed, disabled, selected, focus, renaming, checked, indeterminate, loading, ...hoverActivePseudos],
    },
    { name: "controlIndicator", states: [...openClosed, disabled, selected, focus, loading] },
    { name: "itemContent", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<TreeRootProps<TreeNode>>()({}),
});
