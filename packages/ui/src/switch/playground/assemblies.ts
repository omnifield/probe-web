// STRUCTURAL assembly templates for the switch — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-127`).
//
// ONE assembly — `root` wrapping `control` (wrapping `thumb`) and `label`, checked by default so
// the thumb's resting position at the "on" end is visible without a click.
//
// The real hidden `<input type="checkbox">` is NOT named here (постановка user, 2026-09-01,
// README «`extras` — проверка по всему киту: кейса не нашлось ни одного») — `Switch`'s own root
// (`../components/kit.tsx`) already renders one.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type SwitchPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<SwitchPart>[] = [
  {
    name: "basic",
    means: "рабочий переключатель, включён",
    tree: {
      node: "root",
      props: { defaultChecked: true },
      children: [
        { node: "control", children: [{ node: "thumb" }] },
        { node: "label", children: [{ genus: "text", value: "Уведомления" }] },
      ],
    },
  },
];
