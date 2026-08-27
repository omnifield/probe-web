// EDITOR-ONLY per-part taxonomy for the table — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type TablePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

// `headerCell`/`headerSortTrigger` share one three-valued dictionary (`../entity/passport.ts`'s
// own `sortStates`) — written once here and reused.
const sortStateMeans = {
  ascending: { means: "this column is the one currently sorted, low to high" },
  descending: { means: "this column is the one currently sorted, high to low" },
  none: { means: "this column can sort, but isn't the one sorted right now" },
} satisfies PassportPartEditorInfo<TablePart>["states"];

export const parts: Readonly<Record<TablePart, PassportPartEditorInfo<TablePart>>> = {
  root: {
    means: "the whole table",
    states: {},
    accepts: [
      { kind: "part", name: "caption" },
      { kind: "part", name: "head" },
      { kind: "part", name: "body" },
    ],
  },
  caption: {
    means: "the table's own caption — describes what the table holds",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  head: {
    means: "wraps the header row(s)",
    states: {},
    accepts: [{ kind: "part", name: "headRow" }],
  },
  headRow: {
    means: "one row of column headers",
    states: {},
    accepts: [{ kind: "part", name: "headerCell" }],
  },
  headerCell: {
    means: "one column's header — carries the sorted look for that column, whether or not it holds a button",
    states: sortStateMeans,
    accepts: [
      { kind: "part", name: "headerSortTrigger" },
      { kind: "content", genus: "text" },
    ],
  },
  headerSortTrigger: {
    means: "the button that toggles this column's sort — a real button, separate from its cell so a non-sortable column can simply omit it",
    states: {
      ...sortStateMeans,
      disabled: { means: "this column cannot sort — no button behavior, just the native disabled look" },
      hover: { means: "pointer is over this button" },
      "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
      active: { means: "this button is being held down" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  body: {
    means: "wraps the data rows",
    states: {},
    accepts: [{ kind: "part", name: "row" }],
  },
  row: {
    means: "one data row — v1 has no per-row look (no selection, no pinning)",
    states: {},
    accepts: [{ kind: "part", name: "cell" }],
  },
  cell: {
    means: "one cell — content is the consumer's, same as every other kit part",
    states: {},
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "content", genus: "component" },
    ],
  },
};
