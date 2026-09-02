import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type CarouselPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<CarouselPart, string, Data> = {
  name: "basic",
  means: "рабочая карусель: три слайда из данных, стрелки листают, точки прыгают на слайд, кнопка запускает автопрокрутку, счётчик страниц",
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
            children: [
              {
                node: "autoplayIndicator",
                props: { fallback: "▶" },
                children: [{ genus: "text", value: "⏸" }],
              },
            ],
          },
          { node: "nextTrigger", children: [{ genus: "text", value: "›" }] },
        ],
      },
      {
        node: "itemGroup",
        children: [
          { node: "item", props: { index: 0 }, children: [{ genus: "text", value: { path: "/slide1/label" } }] },
          { node: "item", props: { index: 1 }, children: [{ genus: "text", value: { path: "/slide2/label" } }] },
          { node: "item", props: { index: 2 }, children: [{ genus: "text", value: { path: "/slide3/label" } }] },
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
};
