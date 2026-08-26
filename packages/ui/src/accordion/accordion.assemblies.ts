// STRUCTURAL assembly templates for the accordion — split out of `accordion.editor.ts` (`PWEB-124`).
//
// EMPTY RIGHT NOW, ON PURPOSE. The five assemblies that used to live here were removed: they
// varied by item COUNT (3 vs 6) and by which item was OPEN initially — neither is a structural
// question. Our own doc already said this before these were ever written
// (`packages/ui/README.md`, "Базовая сборка": "condition axes are set on top of a record by
// whoever displays it — an assembly carries no state axis of its own") — the five entries
// violated that outright, and nobody caught it in review.
//
// An assembly answers exactly one question: what is a legal, WORKING shape of this component's
// tree — which content slot can hold what, composed with which parts, nested how. Item count is
// data a consumer fills the component with (an array of 2 objects and an array of 5 do not need
// two different accordions); which item starts open is state, the same axis `hover` or `disabled`
// is — already covered by `accordion.editor.ts`'s `parts[...].states`, not this file's job to
// re-demonstrate.
//
// New entries here are structural candidates only — worked examples of composition an agent could
// not safely guess from `accepts` rules alone: a nested accordion inside an item's content
// (`itemContent.accepts` already allows `genus: "component"` — never actually demonstrated), a
// non-text indicator, and so on. Pending: which of these to write up (`PWEB-124`, follow-up).
//
// One structural gap found while looking at this: `root.accepts` only admits `{ kind: "part",
// name: "item" }` — a divider BETWEEN items (raised as a real example of "what the kit should
// prove is possible") cannot be assembled at all under the current nesting rule. Showing it would
// mean extending `root.accepts` first, in `accordion.editor.ts` — a passport-contract change, not
// something this file can paper over with a tree the rule would reject.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";

export const assemblies: readonly PassportAssembly[] = [];
