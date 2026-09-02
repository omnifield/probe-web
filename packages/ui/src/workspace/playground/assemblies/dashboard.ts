import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";
import { PANEL, RAIL, STAGE, TOPBAR } from "./slots.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const dashboard: PassportAssembly<WorkspacePart> = {
  name: "dashboard",
  means: "«dashboard» — шапка, рельсы, показ и правая панель разом, без подвала",
  tree: { node: "root", children: [TOPBAR, RAIL, STAGE, PANEL] },
};
