// STRUCTURAL assembly templates for the timer — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/assemblies.ts` (`PWEB-127`).
//
// ONE entry: `root` wrapping `area`(`item type="minutes"` + `separator` + `item type="seconds"`) +
// `control`(`actionTrigger action="start"` + `actionTrigger action="pause"` + `actionTrigger
// action="reset"`) — a plain mm:ss countdown with the three most common actions.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type TimerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<TimerPart>[] = [
  {
    name: "basic",
    means: "a mm:ss countdown with start, pause, and reset",
    tree: {
      node: "root",
      props: { countdown: true, startMs: 60_000 },
      children: [
        {
          node: "area",
          children: [
            { node: "item", props: { type: "minutes" } },
            { node: "separator", children: [{ genus: "text", value: ":" }] },
            { node: "item", props: { type: "seconds" } },
          ],
        },
        {
          node: "control",
          children: [
            { node: "actionTrigger", props: { action: "start" }, children: [{ genus: "text", value: "Start" }] },
            { node: "actionTrigger", props: { action: "pause" }, children: [{ genus: "text", value: "Pause" }] },
            { node: "actionTrigger", props: { action: "reset" }, children: [{ genus: "text", value: "Reset" }] },
          ],
        },
      ],
    },
  },
];
