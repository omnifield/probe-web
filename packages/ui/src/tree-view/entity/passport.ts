import {
  defineSettings,
  definePassport,
  type PassportState,
} from "@omnifield/probe-web-skin/model";

import type { TreeNode, TreeViewProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Real DOM/keyboard/pointer focus target — explicit, mirrored where the node itself is not focusable. */
const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;
/** This node is part of the current selection. */
const selected = {
  name: "selected",
  mark: { kind: "attribute", name: "data-selected" },
} as const satisfies PassportState;
/** This node cannot be interacted with. */
const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;
/** This node's label is being edited right now (`F2`, or `startRenaming(value)`). */
const renaming = {
  name: "renaming",
  mark: { kind: "attribute", name: "data-renaming" },
} as const satisfies PassportState;
/** Present only when fully checked — see the file header ("two independent booleans"). */
const checked = {
  name: "checked",
  mark: { kind: "attribute", name: "data-checked" },
} as const satisfies PassportState;
/** Present only when SOME, not all, descendants are checked — the other of the same pair. */
const indeterminate = {
  name: "indeterminate",
  mark: { kind: "attribute", name: "data-indeterminate" },
} as const satisfies PassportState;
/** A branch is fetching its own children (`loadChildren`) — leaf parts never carry this. */
const loading = {
  name: "loading",
  mark: { kind: "attribute", name: "data-loading" },
} as const satisfies PassportState;
/** A branch is expanded. */
const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;
/** A branch is collapsed — the same attribute, the other value. */
const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;
const openClosed: readonly PassportState[] = [open, closed];

/** A genuine, hoverable/pressable surface with no JS-tracked pointer state — see the file header. */
const hoverActivePseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

/** Passport of the tree view — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "label", states: [] },
    { name: "tree", states: [] },
    {
      name: "item",
      states: [focus, selected, disabled, renaming, checked, indeterminate],
      variables: [{ name: "--depth", setBy: "kit" }],
    },
    // Наша часть (`entity/anatomy.ts`'s `extendWith`), не Ark — своих состояний не несёт: реальный
    // фокус/выделение живут на `item` самом, `itemTrigger` только группирует `itemText`/
    // `itemIndicator`, зеркаля `branchControl` для листа (без раскрытия — раскрывать нечего).
    { name: "itemTrigger", states: [] },
    { name: "itemText", states: [disabled, selected, focus] },
    { name: "itemIndicator", states: [disabled, selected, focus] },
    // Наша часть (`entity/anatomy.ts`'s `extendWith`), не Ark — своих состояний не несёт, ровно
    // как и `tree` выше: место под содержимое потребителя, у него нет собственного вида.
    { name: "itemContent", states: [] },
    {
      name: "branch",
      states: [selected, disabled, loading, ...openClosed],
      variables: [{ name: "--depth", setBy: "kit" }],
    },
    {
      name: "branchControl",
      states: [
        ...openClosed,
        disabled,
        selected,
        focus,
        renaming,
        checked,
        indeterminate,
        loading,
        ...hoverActivePseudos,
      ],
    },
    { name: "branchText", states: [...openClosed, disabled, loading] },
    {
      name: "branchIndicator",
      states: [...openClosed, disabled, selected, focus, loading],
    },
    {
      name: "branchTrigger",
      states: [...openClosed, disabled, loading, ...hoverActivePseudos],
    },
    { name: "branchContent", states: openClosed },
    { name: "branchIndentGuide", states: [] },
    {
      name: "nodeCheckbox",
      states: [
        {
          name: "checked",
          mark: { kind: "attribute", name: "data-state", value: "checked" },
        },
        {
          name: "unchecked",
          mark: { kind: "attribute", name: "data-state", value: "unchecked" },
        },
        {
          name: "indeterminate",
          mark: {
            kind: "attribute",
            name: "data-state",
            value: "indeterminate",
          },
        },
        disabled,
        ...hoverActivePseudos,
      ],
    },
    { name: "nodeRenameInput", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `selectionMode`/`expandOnClick`/`typeahead` are
  // all real props, but none is `orientation`/`multiple`/`collapsible` — the same empty result
  // the dialog's/drawer's own settings already show.
  settings: defineSettings<TreeViewProps<TreeNode>>()({}),
});
