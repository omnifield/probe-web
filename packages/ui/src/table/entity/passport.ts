// RUNTIME passport of the table — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES, the variant axis, and SETTINGS, tied together by `definePassport`. The
// kit's second OWN component (after the button): no Ark UI, no Zag connector to read marks off
// of — every mark below is a DECISION, named as one, not a fact read out of a `.connect.mjs`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// ## Six of the nine parts carry NO state at all
//
// `root`/`caption`/`head`/`headRow`/`body`/`row`/`cell` are pure structure — v1's agreed scope
// (2026-08-26) is sorting only, no row selection, no pinning, no grouping — the same restraint
// grid's own `cell` and flow's own `item` already declare for themselves (an empty `states: []`
// is a checkable claim, not a placeholder).
//
// ## `headerCell` and `headerSortTrigger` share one three-valued attribute
//
// `ascending`/`descending`/`none` on `data-state` — the same device checkbox's `checked`/
// `unchecked`/`indeterminate` already uses for a single shared attribute with more than two
// values. Both parts carry it (`../components/index.tsx` computes the same value for each), so a
// skin can address either "the header cell looks sorted" or "the sort button looks sorted"
// independently, the same accordion/trigger split reasoning the anatomy's own header explains.
//
// `headerCell`'s copy is OMITTED ENTIRELY (no attribute at all, not `"none"`) when the column
// cannot sort — mirrors `aria-sort`, which the WAI-ARIA `columnheader` role only allows on columns
// that actually support it. Claiming `data-state="none"` on every column, sortable or not, would
// assert a capability that isn't there.
//
// ## `headerSortTrigger`'s hover/active/focus-visible are PSEUDO — it is a genuine `<button>`
//
// No pointer tracking in `../components/index.tsx` at all — same reasoning the plain button and
// the toggle group's own item already apply. `disabled` is native `disabled` on the element
// itself (`../components/index.tsx`, when `header.column.getCanSort()` is false), so `:disabled`
// is the honest mark — a browser gives it for free, the same category as `:hover`/`:active` here.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props. `Record<string, unknown>` stands in for `TData` (TanStack's own
// `RowData` bound rules out bare `unknown`): the passport does not care what a row's own data
// type is, only that `TableRootProps` has no setting-vocabulary prop to declare.
import type { TableRootProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Sorted ascending. Shared by `headerCell` and `headerSortTrigger` — the same fact, two addresses. */
const ascending = {
  name: "ascending",
  mark: { kind: "attribute", name: "data-state", value: "ascending" },
} as const satisfies PassportState;

/** Sorted descending — the same attribute, the other active value. */
const descending = {
  name: "descending",
  mark: { kind: "attribute", name: "data-state", value: "descending" },
} as const satisfies PassportState;

/** Sortable, but not currently sorted. Absent entirely on `headerCell` when the column cannot sort at all. */
const none = {
  name: "none",
  mark: { kind: "attribute", name: "data-state", value: "none" },
} as const satisfies PassportState;

/** Shared by `headerCell` and `headerSortTrigger` — see the file header for the "omitted, not `none`" case. */
const sortStates: readonly PassportState[] = [ascending, descending, none];

/** Passport of the table — anatomy plus what anatomy alone does not say. */
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
  // THE TABLE HAS NO SETTINGS (same declaration the button/icon already make): sorting is STATE
  // (a fact of the moment, expressed above), not a closed-vocabulary axis an author picks, and
  // `orientation`/`multiple`/`collapsible` have nothing on a table to attach to.
  settings: defineSettings<TableRootProps<Record<string, unknown>>>()({}),
});
