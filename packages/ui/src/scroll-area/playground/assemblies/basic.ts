import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type ScrollAreaPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<ScrollAreaPart, string, Data> = {
  name: "basic",
  means: "рабочая область прокрутки: длинный текст из данных, вертикальный ползунок реально едет",
  tree: {
    node: "root",
    children: [
      {
        node: "viewport",
        children: [{ node: "content", children: [{ genus: "text", value: { path: "/content" } }] }],
      },
      {
        node: "scrollbar",
        props: { orientation: "vertical" },
        children: [{ node: "thumb", props: { orientation: "vertical" } }],
      },
      { node: "corner" },
    ],
  },
};
