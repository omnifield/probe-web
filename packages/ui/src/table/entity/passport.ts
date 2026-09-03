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

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "caption", states: [] },
    { name: "head", states: [] },
    { name: "headRow", states: [] },
    { name: "headerCell", states: sortStates },
    {
      name: "headerSortTrigger",
      states: [
        ...sortStates,
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "body", states: [] },
    { name: "row", states: [] },
    { name: "cell", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<TableRootProps<Record<string, unknown>>>()({}),
});
