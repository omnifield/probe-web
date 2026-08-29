// STRUCTURAL assembly templates for the scroll area — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-127`).
//
// ONE assembly — `root` wrapping `viewport`(`content`), one vertical `scrollbar`(`thumb`), and
// `corner`. `content` carries enough real text that the fixed height the recipe gives `root`
// actually overflows — a scroll area with nothing to scroll proves nothing.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type ScrollAreaPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const PARAGRAPH =
  "Список длинный специально: прокрутка должна быть настоящей, а не нарисованной. " +
  "Строка первая. Строка вторая. Строка третья. Строка четвёртая. Строка пятая. " +
  "Строка шестая. Строка седьмая. Строка восьмая. Строка девятая. Строка десятая.";

export const assemblies: readonly PassportAssembly<ScrollAreaPart>[] = [
  {
    name: "basic",
    means: "рабочая область прокрутки: длинный текст, вертикальный ползунок реально едет",
    tree: {
      node: "root",
      children: [
        {
          node: "viewport",
          children: [{ node: "content", children: [{ genus: "text", value: PARAGRAPH }] }],
        },
        {
          node: "scrollbar",
          props: { orientation: "vertical" },
          children: [{ node: "thumb", props: { orientation: "vertical" } }],
        },
        { node: "corner" },
      ],
    },
  },
];
