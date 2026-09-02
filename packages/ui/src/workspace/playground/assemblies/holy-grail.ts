import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";
import { BOTTOM, PANEL, RAIL, STAGE, TOPBAR } from "./slots.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const holyGrail: PassportAssembly<WorkspacePart> = {
  name: "holy-grail",
  means: "«Holy Grail Layout» целиком — шапка, подвал и три колонки, все шесть слотов сразу",
  tree: { node: "root", children: [TOPBAR, RAIL, STAGE, PANEL, BOTTOM] },
};
