// STRUCTURAL assembly templates for the carousel — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-127`).
//
// ONE assembly, three slides — the shape in `components/index.tsx`'s own doc-comment example
// (`root` wrapping `control`/`itemGroup`/`indicatorGroup`), extended with the autoplay toggle and
// the page-count text so all eleven parts are exercised at least once: `autoplayTrigger` nests
// inside `control` next to the prev/next buttons and carries `autoplayIndicator` as its own
// icon-swap child, matching Ark's own "Autoplay" example — the corrected placement `parts.ts`
// now declares. Three slides is the minimum that shows an indicator PASSING OVER one it isn't
// headed to, the same reasoning the tabs' own "basic" assembly used for its third tab.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type CarouselPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<CarouselPart>[] = [
  {
    name: "basic",
    means: "a working carousel: three slides, arrows page through them, dots jump to a slide, a button starts autoplay, a page counter",
    tree: {
      node: "root",
      props: { slideCount: 3, defaultPage: 0 },
      children: [
        {
          node: "control",
          children: [
            { node: "prevTrigger", children: [{ genus: "text", value: "‹" }] },
            {
              node: "autoplayTrigger",
              children: [{ node: "autoplayIndicator", children: [{ genus: "text", value: "⏸" }] }],
            },
            { node: "nextTrigger", children: [{ genus: "text", value: "›" }] },
          ],
        },
        {
          node: "itemGroup",
          children: [
            { node: "item", props: { index: 0 }, children: [{ genus: "text", value: "Slide 1" }] },
            { node: "item", props: { index: 1 }, children: [{ genus: "text", value: "Slide 2" }] },
            { node: "item", props: { index: 2 }, children: [{ genus: "text", value: "Slide 3" }] },
          ],
        },
        {
          node: "indicatorGroup",
          children: [
            { node: "indicator", props: { index: 0 } },
            { node: "indicator", props: { index: 1 } },
            { node: "indicator", props: { index: 2 } },
          ],
        },
        { node: "progressText" },
      ],
    },
  },
];
