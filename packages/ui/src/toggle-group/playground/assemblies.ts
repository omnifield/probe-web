// STRUCTURAL assembly templates for the toggle group — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-127`).
//
// ONE assembly, three buttons — the smallest shape that exercises pressed vs. unpressed AND
// shows the segmented look holding more than two options, the same reasoning the tabs' own
// "basic" assembly used for its third tab.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type ToggleGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<ToggleGroupPart>[] = [
  {
    name: "basic",
    means: "рабочий переключатель: три кнопки, левая нажата",
    tree: {
      part: "root",
      props: { defaultValue: ["left"] },
      children: [
        { part: "item", props: { value: "left" }, children: [{ genus: "text", value: "Слева" }] },
        { part: "item", props: { value: "center" }, children: [{ genus: "text", value: "По центру" }] },
        { part: "item", props: { value: "right" }, children: [{ genus: "text", value: "Справа" }] },
      ],
    },
  },
];
