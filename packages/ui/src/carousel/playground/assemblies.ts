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
    means: "рабочая карусель: три слайда, стрелки листают, точки прыгают на слайд, кнопка запускает автопрокрутку, счётчик страниц",
    tree: {
      part: "root",
      props: { slideCount: 3, defaultPage: 0 },
      children: [
        {
          part: "control",
          children: [
            { part: "prevTrigger", children: [{ genus: "text", value: "‹" }] },
            {
              part: "autoplayTrigger",
              children: [{ part: "autoplayIndicator", children: [{ genus: "text", value: "⏸" }] }],
            },
            { part: "nextTrigger", children: [{ genus: "text", value: "›" }] },
          ],
        },
        {
          part: "itemGroup",
          children: [
            { part: "item", props: { index: 0 }, children: [{ genus: "text", value: "Слайд 1" }] },
            { part: "item", props: { index: 1 }, children: [{ genus: "text", value: "Слайд 2" }] },
            { part: "item", props: { index: 2 }, children: [{ genus: "text", value: "Слайд 3" }] },
          ],
        },
        {
          part: "indicatorGroup",
          children: [
            { part: "indicator", props: { index: 0 } },
            { part: "indicator", props: { index: 1 } },
            { part: "indicator", props: { index: 2 } },
          ],
        },
        { part: "progressText" },
      ],
    },
  },
];
