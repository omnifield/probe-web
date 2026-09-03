import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";
import { basic } from "./basic.js";

type ToggleGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<ToggleGroupPart, string, Data>[] = [basic];
