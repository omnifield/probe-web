import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<DiagramPart> = {
  name: "basic",
  means: "TODO",
  tree: {
    node: "root",
    props: { width: 360, height: 240 },
  },
};
