import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";
import { STAGE, TOPBAR } from "./slots.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const stacked: PassportAssembly<WorkspacePart> = {
  name: "stacked",
  means: "«stacked» (Tailwind UI) — шапка во всю ширину, показ под ней, без колонок вовсе",
  tree: { node: "root", children: [TOPBAR, STAGE] },
};
