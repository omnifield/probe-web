// TEMPLATE — structure prepared, no sample instance written here.
//
// STRUCTURAL assembly templates for the slider — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/assemblies.ts` (`PWEB-127`): the
// file exists even before it holds anything.
//
// LEFT EMPTY for whoever fills the playground zone next — same type derivation as everywhere
// else, ready to receive entries. A likely first entry, structurally (verified against
// `../entity/anatomy.ts` and `parts.ts`'s `accepts`, content not written): `root` wrapping
// `label` + `valueText` + `control`(`track`(`range`) + one `thumb`). A range slider (two thumbs)
// is the natural second entry, once a single value is proven.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type SliderPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<SliderPart>[] = [];
