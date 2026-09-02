import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";
import { PANEL, RAIL, STAGE } from "./slots.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const multiColumn: PassportAssembly<WorkspacePart> = {
  name: "multi-column",
  means: "«multi-column» (Tailwind UI) — рельсы, показ и правая колонка, без шапки: почта, доска задач",
  tree: { node: "root", children: [RAIL, STAGE, PANEL] },
};
