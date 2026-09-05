import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";
import { RAIL, STAGE } from "./slots.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const sidebar: PassportAssembly<WorkspacePart> = {
  name: "sidebar",
  means: "«sidebar» (Tailwind UI) — только левая колонка и показ, без шапки",
  tree: { node: "root", children: [RAIL, STAGE] },
};
