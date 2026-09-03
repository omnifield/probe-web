import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type TogglePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<TogglePart, string, Data> = {
  name: "basic",
  means: "нажатый тумблер, глиф из данных",
  tree: {
    node: "root",
    props: { defaultPressed: true },
    children: [{ node: "indicator", children: [{ genus: "text", value: { path: "/glyph" } }] }],
  },
};
