import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type SwitchPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<SwitchPart, string, Data> = {
  name: "basic",
  means: "рабочий переключатель из данных, включён",
  tree: {
    node: "root",
    props: { defaultChecked: true },
    children: [
      { node: "control", children: [{ node: "thumb" }] },
      { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
    ],
  },
};
