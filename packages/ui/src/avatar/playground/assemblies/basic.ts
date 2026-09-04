import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type AvatarPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<AvatarPart, string, Data> = {
  name: "basic",
  means: "аватар с настоящей картинкой и заглушкой из инициалов, оба из данных",
  tree: {
    node: "root",
    children: [
      { node: "fallback", children: [{ genus: "text", value: { path: "/fallback" } }] },
      { node: "image", bind: { src: "/src", alt: "/alt" } },
    ],
  },
};
