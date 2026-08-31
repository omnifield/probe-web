// STRUCTURAL assembly templates for the radio group — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-127`).
//
// ONE assembly, three choices — the shape in `ark-ui.com`'s own "Basic" example (`root` wrapping
// `label` + one `item` per choice, each holding `itemControl` + `itemText`), plus the single
// `indicator` as a direct sibling of the items — confirmed against Ark's own documented anatomy
// (`ark-ui` MCP, 2026-08-26), not the per-item nesting the component's own doc-comment example
// guessed at. Three choices is the minimum that shows the indicator PASSING OVER one it isn't
// headed to, the same reasoning the tabs' own "basic" assembly used for its third tab.
//
// Each item ALSO holds the real hidden `<input type="radio">` (`{ extra: "hiddenInput" }`,
// `PWEB-152`) — without it the preview looks right but a click never actually changes the chosen
// value: the real `onChange` lives on that exact node, `item`'s own `<label>` has none.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type RadioGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<RadioGroupPart>[] = [
  {
    name: "basic",
    means: "a working group: three choices, the dot travels to whichever is picked",
    tree: {
      node: "root",
      props: { defaultValue: "standard" },
      children: [
        { node: "label", children: [{ genus: "text", value: "Delivery" }] },
        {
          node: "item",
          props: { value: "standard" },
          children: [
            { node: "itemControl" },
            { node: "itemText", children: [{ genus: "text", value: "Standard" }] },
            { extra: "hiddenInput" },
          ],
        },
        {
          node: "item",
          props: { value: "express" },
          children: [
            { node: "itemControl" },
            { node: "itemText", children: [{ genus: "text", value: "Express" }] },
            { extra: "hiddenInput" },
          ],
        },
        {
          node: "item",
          props: { value: "pickup" },
          children: [
            { node: "itemControl" },
            { node: "itemText", children: [{ genus: "text", value: "Pickup" }] },
            { extra: "hiddenInput" },
          ],
        },
        { node: "indicator" },
      ],
    },
  },
];
