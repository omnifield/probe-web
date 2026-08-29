// STRUCTURAL assembly templates for the button — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-116`, split out `PWEB-127`). Same physical shape as every other component's
// `playground/assemblies.ts` — a button with one working instance would still get this file, and
// this one has three.
//
// SEVERAL ASSEMBLY TEMPLATES. A button is a simpler subject than an accordion — one node, no
// nesting, no state-in-assembly — and padding the list for a round number is pointless: the
// honest count here is three, exactly what a button can be by content composition
// (`parts.ts`'s `root.accepts`: text, icon, or both) — no more, no less.
//
// No assembly needs a prop to work — the same provider knowledge as before, just empty, and it
// does not change from one assembly to the next.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { passport } from "../entity/passport.js";

// The literal part-name union, read off the passport itself rather than spelled out by hand:
// own-part `node` values below get autocomplete against ANATOMY (not enforced by `tsc` — a
// `node` also accepts a foreign registry name, `PWEB-172`), not a copy of names that could drift.
type ButtonPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<ButtonPart>[] = [
  {
    name: "base",
    means: "a button with a label",
    tree: { node: "root", children: [] },
  },
];
