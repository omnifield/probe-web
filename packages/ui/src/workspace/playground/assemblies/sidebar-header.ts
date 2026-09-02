import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";
import { RAIL, STAGE, TOPBAR } from "./slots.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const sidebarHeader: PassportAssembly<WorkspacePart> = {
  name: "sidebar-header",
  means: "рельсы плюс шапка над показом — тот же «sidebar», с верхней полосой",
  tree: { node: "root", children: [RAIL, TOPBAR, STAGE] },
};
