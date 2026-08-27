// EDITOR-ONLY per-part taxonomy for the button — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-115`/`PWEB-118`, decomposed `PWEB-124`, split out `PWEB-127`). Means, states, and
// nesting — the taxonomy half of the editor slice; scenario data (`assemblies.ts`) is the other,
// split out the same way and for the same reason: the SAME physical shape as every other
// component's `playground/`, not a size-driven exception — one part is still a part.
//
// There is no `parts` list inside `root` — the button has one part, there is nothing to nest
// inside itself. Content is named by GENUS, not by component names — an icon arrives from a
// different package, and a list of names here would fall behind on the very next icon.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

// The literal part-name union, read off the passport itself — see `assemblies.ts` for the same
// device and the same reason (no contextual typing reaches into a separate module).
type ButtonPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<ButtonPart, PassportPartEditorInfo<ButtonPart>>> = {
  root: {
    means: 'the whole button — a single node, a native `<button type="button">` by default',
    states: {
      hover: { means: "pointer is over the button" },
      "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
      active: { means: "the button is being held down" },
      disabled: { means: "cannot be pressed; the button does not call its handler" },
      busy: { means: "work is in progress — the consumer sets this attribute together with `disabled`" },
      expanded: { means: "the button has expanded what it controls — the attribute arrives from an outer component" },
      pressed: { means: "a toggle button is pressed — pressedness belongs to the outer component, the look belongs to the button" },
    },
    // Layout is deliberately not accepted inside a button: a button is an endpoint you press,
    // not a place for a tree. Allowing "any component" would make the nesting rule reject
    // nothing at all, leaving it the same "yes or no" it already was.
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
