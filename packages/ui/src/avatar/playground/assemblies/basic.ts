import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

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
