// STRUCTURAL assembly templates for the switch — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-127`).
//
// ONE assembly — `root` wrapping `control` (wrapping `thumb`) and `label`, checked by default so
// the thumb's resting position at the "on" end is visible without a click.
//
// `root` also holds the real hidden `<input type="checkbox">` (`{ extra: "hiddenInput" }`,
// `PWEB-152`) — without it the preview looks right but a click never actually toggles the switch.

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
        { extra: "hiddenInput" },
      ],
    },
  },
];
