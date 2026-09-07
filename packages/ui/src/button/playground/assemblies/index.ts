import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";
import { base } from "./base.js";
import { iconOnly } from "./icon-only.js";
import { withIcon } from "./with-icon.js";

type ButtonPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<ButtonPart, string, Data>[] =
  [base, withIcon, iconOnly];
