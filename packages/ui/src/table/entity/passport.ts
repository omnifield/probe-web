import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
import type { TableRootProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const ascending = {
  name: "ascending",
  mark: { kind: "attribute", name: "data-state", value: "ascending" },
} as const satisfies PassportState;

const descending = {
  name: "descending",
  mark: { kind: "attribute", name: "data-state", value: "descending" },
} as const satisfies PassportState;

const none = {
  name: "none",
  mark: { kind: "attribute", name: "data-state", value: "none" },
} as const satisfies PassportState;

const sortStates: readonly PassportState[] = [ascending, descending, none];

const checkedPseudo = { name: "checked", mark: { kind: "pseudo", name: ":checked" } } as const satisfies PassportState;
const disabledPseudo = { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } } as const satisfies PassportState;
const hoverPseudo = { name: "hover", mark: { kind: "pseudo", name: ":hover" } } as const satisfies PassportState;
const focusVisiblePseudo = { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } } as const satisfies PassportState;
const activePseudo = { name: "active", mark: { kind: "pseudo", name: ":active" } } as const satisfies PassportState;

const checkboxPseudos: readonly PassportState[] = [
  checkedPseudo,
  disabledPseudo,
  hoverPseudo,
  focusVisiblePseudo,
  activePseudo,
];

const pinnedStart = { name: "pinned-start", mark: { kind: "attribute", name: "data-pinned", value: "start" } } as const satisfies PassportState;
const pinnedEnd = { name: "pinned-end", mark: { kind: "attribute", name: "data-pinned", value: "end" } } as const satisfies PassportState;
const pinnedStates: readonly PassportState[] = [pinnedStart, pinnedEnd];

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "caption", states: [] },
    { name: "head", states: [] },
    { name: "headRow", states: [] },
    { name: "headerCell", states: [...sortStates, ...pinnedStates] },
    {
      name: "headerSortTrigger",
      states: [
        ...sortStates,
        disabledPseudo,
        hoverPseudo,
        focusVisiblePseudo,
        activePseudo,
      ],
      variables: [{ name: "--sort-index", setBy: "kit" }],
    },
    {
      name: "headerSelectTrigger",
      states: [
        ...checkboxPseudos,
        { name: "indeterminate", mark: { kind: "pseudo", name: ":indeterminate" } },
      ],
    },
    { name: "body", states: [] },
    { name: "row", states: [{ name: "selected", mark: { kind: "attribute", name: "data-selected" } }] },
    { name: "cell", states: pinnedStates },
    { name: "rowSelectTrigger", states: checkboxPseudos },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<TableRootProps<Record<string, unknown>>>()({}),
});
