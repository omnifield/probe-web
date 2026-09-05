import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";
import { BOTTOM, RAIL, STAGE, TOPBAR } from "./slots.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const sidebarFooter: PassportAssembly<WorkspacePart> = {
  name: "sidebar-footer",
  means: "рельсы и шапка над показом плюс подвал снизу, без правой панели",
  tree: { node: "root", children: [TOPBAR, RAIL, STAGE, BOTTOM] },
};
