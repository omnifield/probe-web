// TEMPLATE — structure prepared, no sample instance written here.
//
// STRUCTURAL assembly templates for the toast — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/assemblies.ts` (`PWEB-127`): the
// file exists even before it holds anything.
//
// LEFT EMPTY for whoever fills the playground zone next — same type derivation as everywhere
// else, ready to receive entries. STRUCTURALLY HARDER than most: `group` is drawn by `Toaster`,
// which needs a live STORE (`createToaster(...)`) and iterates it via a Solid render prop
// (`children: (toast: Accessor<ToastOptions>) => JSX.Element`) — an assembly tree has no way to
// express "call `createToaster` once, then queue a toast into it," the same "root's real content
// is a render prop, not children" wrinkle the table's own assemblies template names for its own
// `root`. A working assembly would need to fix ONE toast's own `root` (`title`/`description`/
// `actionTrigger`/`closeTrigger`) as a snapshot, the same device the table's own default-structure
// fallback used once filled in — not attempted here.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type ToastPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<ToastPart>[] = [];
