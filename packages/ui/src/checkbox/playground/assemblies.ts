// STRUCTURAL assembly templates for the checkbox — read by `./index.ts`'s `defineEditorInfo`
// call (split out `PWEB-127`). Same physical shape as every other component's
// `playground/assemblies.ts` — one working instance still gets its own file.
//
// `root` also holds the real hidden `<input type="checkbox">` (`{ extra: "hiddenInput" }`,
// `PWEB-152`) — a direct sibling of `control`/`label`, matching Ark's own documented composition
// (`../components/index.tsx`'s own doc example). Without it the preview looks right but a click
// never actually toggles the checked state: the real `onChange` lives on that exact node.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type CheckboxPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<CheckboxPart>[] = [
  {
    name: "basic",
    means: "a checkbox with a label, control frame, and indicator",
    tree: {
      node: "root",
      children: [
        {
          node: "control",
          children: [{ node: "indicator", children: [{ genus: "text", value: "✓" }] }],
        },
        { node: "label", children: [{ genus: "text", value: "I agree to the terms" }] },
        { extra: "hiddenInput" },
      ],
    },
  },
];
