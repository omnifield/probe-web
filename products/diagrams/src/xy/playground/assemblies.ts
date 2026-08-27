// TEMPLATE — structure prepared, no sample instance written here.
//
// STRUCTURAL assembly templates for the xy family — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every kit component's `playground/assemblies.ts` (`PWEB-127`).
//
// LEFT EMPTY for whoever fills the playground zone next. STRUCTURALLY HARDER than most: `scale`
// is a real `d3-scale` instance, computed by the CALLER (`../components/index.tsx`'s own file
// header — explicit prop, not context) — an assembly tree addresses PARTS and CONTENT, not a
// computed value handed down from outside. The same "root's real machinery is not expressible as
// a static tree" wrinkle the kit's own table/tree-view name for their own `root`.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type XyPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<XyPart>[] = [];
