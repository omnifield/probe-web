// STRUCTURAL assembly templates for the menu — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-127`).
//
// `positioner` wrapping `content`(`arrow`(`arrowTip`) + a labeled `itemGroup` of two plain items +
// `separator` + one item shaped like a checkbox item). `trigger`/`contextTrigger` are real DOM
// siblings of `positioner` (`parts.ts`'s own header) — the popover's own "floating half only"
// limitation applies here too, same reason.
//
// The tree's `item` node can only ever resolve to plain `MenuItem` (`components/kit.ts` maps ONE
// component per address; `MenuCheckboxItem`/`MenuRadioItem` share `item`'s coordinate but are
// separate, unaddressable-by-name components) — the last item nests `itemIndicator` + `itemText`
// for STRUCTURE/CSS only; it will not carry the real `checked`/`data-type` marks a genuine
// `MenuCheckboxItem` would, the same "demo proves structure, not every runtime mark" scope every
// assembly in this kit already accepts (e.g. the carousel's own unproven `outside-range`).
//
// `providerProps: { defaultOpen: true }` (`PWEB-153`, same device as the popover's own assembly)
// — mounting `positioner` needs the invisible `Menu` context wrapped around it (the kit's
// `provider`, `../components/kit.ts`); `defaultOpen` makes the floating half visible without a
// real click on a `trigger` this assembly never includes.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type MenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<MenuPart>[] = [
  {
    name: "basic",
    means: "the floating menu on its own: a labeled group, a separator, a checked item",
    providerProps: { defaultOpen: true },
    tree: {
      node: "positioner",
      children: [
        {
          node: "content",
          children: [
            { node: "arrow", children: [{ node: "arrowTip" }] },
            {
              node: "itemGroup",
              children: [
                { node: "itemGroupLabel", children: [{ genus: "text", value: "File" }] },
                { node: "item", props: { value: "rename" }, children: [{ genus: "text", value: "Rename" }] },
                { node: "item", props: { value: "delete" }, children: [{ genus: "text", value: "Delete" }] },
              ],
            },
            { node: "separator" },
            {
              node: "item",
              props: { value: "notify" },
              children: [
                { node: "itemIndicator", children: [{ genus: "icon", value: "✓" }] },
                { node: "itemText", children: [{ genus: "text", value: "Notifications" }] },
              ],
            },
          ],
        },
      ],
    },
  },
];
