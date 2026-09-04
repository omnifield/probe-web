import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";
import { area } from "./area.js";
import { bar } from "./bar.js";
import { basic } from "./basic.js";
import { line } from "./line.js";
import { point } from "./point.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<DiagramPart>[] = [basic, line, area, bar, point];
