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
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

// The literal part-name union, read off the passport itself rather than spelled out by hand:
// `part` fields below type-check against ANATOMY, not a copy of its names that could drift from
// it.
type ButtonPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<ButtonPart>[] = [
  {
    name: "label",
    means: "a button with a label",
    tree: { part: "root", children: [{ genus: "text", value: "Button" }] },
  },
  {
    name: "icon-label",
    means: "a button with an icon and a label",
    // The icon LEADS the label — content order is the view author's call (see the accordion
    // passport for the same argument). The icon here is a placeholder (`★`), not a real
    // `lucide-solid` component: the assembly's base is data, not code (`icon.anatomy.ts`).
    tree: {
      part: "root",
      children: [
        { genus: "icon", value: "★" },
        { genus: "text", value: "Button with icon" },
      ],
    },
  },
  {
    name: "icon-only",
    means: "a button with a single icon, no label",
    // A third honest case, not a repeat of the second minus text: an icon-only button is its
    // own real shape (a toolbar, a compact action), and `root.accepts` lets an icon stand alone,
    // without a mandatory label next to it.
    tree: { part: "root", children: [{ genus: "icon", value: "★" }] },
  },
  {
    name: "filled",
    means: "подпись приходит из данных, не из объявления (PWEB-156)",
    tree: {
      part: "root",
      children: [{ genus: "text", value: { path: "/label" } }],
    },
  },
  {
    name: "с-событием",
    means:
      "подпись из данных (не своя, как у `filled`), клик шлёт наружу пейлоад, взятый оттуда же " +
      "(PWEB-157) — кнопка не решает, что в пейлоаде, только резолвит путь, который ей назвали",
    tree: {
      part: "root",
      on: {
        click: {
          event: {
            name: "select",
            context: { payload: { path: "/payload" } },
          },
        },
      },
      children: [{ genus: "text", value: { path: "/label" } }],
    },
  },
];
