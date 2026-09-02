import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";
import { PANEL, STAGE } from "./slots.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const rightRail: PassportAssembly<WorkspacePart> = {
  name: "right-rail",
  means: "правая колонка при показе, без шапки и рельсов — «right rail» блога или документации",
  tree: { node: "root", children: [STAGE, PANEL] },
};
