// STRUCTURAL assembly templates for the avatar — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/assemblies.ts` (`PWEB-127`).
//
// ONE entry: `root` wrapping `fallback` (initials) and `image` (a real `src`). Which of the two
// actually shows is decided at runtime by the real image load (`../entity/passport.ts`'s own file
// header — `visible`/`hidden` flip on `state.matches("loaded")`), not by anything declared here;
// a broken `src` is a second, equally real scenario left for whoever extends this next.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type AvatarPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<AvatarPart>[] = [
  {
    name: "basic",
    means: "an avatar with a real image and an initials fallback",
    tree: {
      node: "root",
      children: [
        { node: "fallback", children: [{ genus: "text", value: "JD" }] },
        { node: "image", props: { src: "https://i.pravatar.cc/128?img=12", alt: "Jane Doe" } },
      ],
    },
  },
];
