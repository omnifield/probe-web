// TEMPLATE — structure prepared, no sample instance written here.
//
// STRUCTURAL assembly templates for the splitter — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/assemblies.ts` (`PWEB-127`):
// the file exists even before it holds anything.
//
// LEFT EMPTY for whoever fills the playground zone next — same type derivation as everywhere
// else, ready to receive entries. A likely first entry, structurally (verified against
// `../entity/anatomy.ts` and `parts.ts`'s `accepts`, content not written): `root` wrapping one
// `panel`, one `resizeTrigger`(`resizeTriggerIndicator`), one more `panel` — the two-pane minimum
// that actually exercises a resize handle at all. The `root`'s own required `panels` prop (an
// array of `{ id }` records the machine matches its children against BY id, `../entity/
// anatomy.ts`'s own header) has no field in an assembly tree — the same "root's real machinery is
// not expressible as a static tree" wrinkle table's/tree view's own assemblies template names for
// their own `root`.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type SplitterPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<SplitterPart>[] = [];
