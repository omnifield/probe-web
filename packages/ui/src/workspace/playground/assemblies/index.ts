import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";
import { dashboard } from "./dashboard.js";
import { holyGrail } from "./holy-grail.js";
import { multiColumn } from "./multi-column.js";
import { rightRail } from "./right-rail.js";
import { sidebar } from "./sidebar.js";
import { sidebarFooter } from "./sidebar-footer.js";
import { sidebarHeader } from "./sidebar-header.js";
import { stacked } from "./stacked.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<WorkspacePart>[] = [
  stacked,
  sidebar,
  sidebarHeader,
  rightRail,
  multiColumn,
  dashboard,
  sidebarFooter,
  holyGrail,
];
