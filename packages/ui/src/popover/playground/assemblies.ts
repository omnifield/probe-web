// STRUCTURAL assembly templates for the popover — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-127`).
//
// ROOT IS `positioner`, not `popover` — the passport's own choice (`../entity/passport.ts`
// explains why: `Popover` renders no DOM node at all). `trigger` genuinely cannot appear in this
// tree (`positioner`'s own `accepts`, `parts.ts`) — a working, clickable demo needs it assembled
// or rendered SEPARATELY, alongside this tree, not inside it. This assembly shows the floating
// half only: `positioner`(`content`(`title` + `description` + `closeTrigger`) + `arrow`
// (`arrowTip`)).
//
// `providerProps: { defaultOpen: true }` (`PWEB-153`) — mounting `positioner` needs the invisible
// `Popover` context wrapped around it (the kit's `provider`, `../components/kit.ts`); `defaultOpen`
// is what makes the floating half visible at all without a real click on a `trigger` this assembly
// never includes.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type PopoverPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<PopoverPart>[] = [
  {
    name: "basic",
    means: "плавающая панель поповера сама по себе: заголовок, текст, крестик закрытия, стрелка",
    providerProps: { defaultOpen: true },
    tree: {
      part: "positioner",
      children: [
        {
          part: "content",
          children: [
            { part: "title", children: [{ genus: "text", value: "Заголовок" }] },
            { part: "description", children: [{ genus: "text", value: "Пояснение к тому, что показано." }] },
            { part: "closeTrigger", children: [{ genus: "text", value: "✕" }] },
          ],
        },
        { part: "arrow", children: [{ part: "arrowTip" }] },
      ],
    },
  },
];
