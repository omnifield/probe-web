import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import { passport } from "../../entity/passport.js";
import { base } from "./base.js";

type TreeViewPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<TreeViewPart>[] = [base];
