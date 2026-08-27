// STRUCTURAL assembly templates for the icon — read by `./index.ts`'s `defineEditorInfo` call
// (split out `PWEB-127`). Same physical shape as every other component's
// `playground/assemblies.ts`, even though this one is EMPTY.
//
// NO working instance, and this is not a gap — it follows from the `./passport` subpath's own
// contract: it is sold as DATA, readable without Solid (README, "What leaves this folder
// outward"). The icon's required prop, `icon` — a reference to a `lucide-solid` component — is
// not data, it is code; there is nothing a declarative assembly tree can hold that would record
// a working instance honestly, and substituting an arbitrary component would misrepresent what
// this assembly is supposed to prove.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type IconPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<IconPart>[] = [];
