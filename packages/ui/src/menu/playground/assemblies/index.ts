import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";
import { basic } from "./basic.js";
import { list } from "./list.js";

type MenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<MenuPart>[] = [basic, list];
