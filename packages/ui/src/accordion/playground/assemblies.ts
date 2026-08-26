// STRUCTURAL assembly templates for the accordion — read by `../playground/index.ts`'s
// `defineEditorInfo` call (`PWEB-116`, decomposed `PWEB-124`).
//
// ONE assembly, not several: item COUNT and which item starts open are not structural questions
// (`packages/ui/README.md`, "Базовая сборка": an assembly carries no state axis of its own, that
// is set on top by whoever displays a record) — five earlier entries here varied by exactly those
// two things and were removed for it. Two items is the minimum that exercises the mechanism's own
// reason for existing — several nodes sharing one coordinate — without turning into a count
// variation. Reuses the same worked example already in `components/index.tsx`'s own doc comment
// (`Shipping` / `Courier and pickup`), so a reader following the component from its JSX to its
// assembly sees one instance, not two invented independently.
//
// Two gaps found while looking at this, NEITHER fixed here:
//   • `root.accepts` only admits `{ kind: "part", name: "item" }` — a divider BETWEEN items
//     cannot be assembled at all under the current nesting rule. Showing one would mean
//     extending `root.accepts` first, in `../playground/index.ts` — a passport-contract change.
//   • a `{ kind: "content", genus: "component" }` node (legal inside `itemContent`) cannot
//     actually carry a nested component's own tree — `PassportAssemblyContent` is a LEAF
//     (`value: string`, no `children`), the same shape an icon placeholder uses below. "A nested
//     accordion inside an item's content" is not buildable with today's assembly-tree type at
//     all, not merely undemonstrated — the type would need a variant that nests a whole
//     `PassportAssemblyPart` tree under a foreign component's own address.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

// The literal part-name union (`"root" | "item" | …`), read off the passport itself rather than
// spelled out by hand: `part` fields below type-check against ANATOMY, not a copy of its names
// that could drift from it. Contextual typing (the way `button/playground/index.ts` gets this for free by
// writing its assemblies inline in the `defineEditorInfo` call) does not reach into a separate
// module — this is what stands in for it here.
type AccordionPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<AccordionPart>[] = [
  {
    name: "basic",
    means:
      "a basic working accordion: two items, each with a trigger, an indicator, and content",
    tree: {
      part: "root",
      children: [
        {
          part: "item",
          props: { value: "shipping" },
          children: [
            {
              part: "itemTrigger",
              children: [
                { genus: "text", value: "Shipping" },
                {
                  part: "itemIndicator",
                  children: [{ genus: "icon", value: "▾" }],
                },
              ],
            },
            {
              part: "itemContent",
              children: [{ genus: "text", value: "Courier and pickup" }],
            },
          ],
        },
        {
          part: "item",
          props: { value: "returns" },
          children: [
            {
              part: "itemTrigger",
              children: [
                { genus: "text", value: "Returns" },
                {
                  part: "itemIndicator",
                  children: [{ genus: "icon", value: "▾" }],
                },
              ],
            },
            {
              part: "itemContent",
              children: [{ genus: "text", value: "Free within 30 days" }],
            },
          ],
        },
      ],
    },
  },
];
