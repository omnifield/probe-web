// RUNTIME passport of the button (`PWEB-2`, decomposed `PWEB-124`, `PWEB-127`) — anatomy
// (`anatomy.ts`) plus everything else the running app needs: per-part STATES, the variant axis,
// and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata (`means`, group, genus, nesting/`accepts` rules, assembly templates)
// lives in `playground/index.ts` instead; that file depends on this one, never the other way.
//
// The button is the kit's first OWN component: Ark UI ships none, because a headless button is
// just a native element — there is nothing to wrap. That makes it the natural place to prove the
// whole mechanism: if the contract fits a component that does not exist in a borrowed kit, it
// fits anything.
//
// Seven states, three of them pseudo-classes. That is accurate: the button does not store
// hover, focus, or press — the browser does, and declaring them as an attribute would be a lie
// in the data. The button attribute-marks exactly one thing itself — disabledness: a disabled
// button has neither `:hover` nor `:active`, and without `data-disabled` that state would be
// invisible from the outside.
//
// The remaining three attributes are NOT set by the button, and that is not a gap — it follows
// from two decisions:
//
//  • busyness (`aria-busy`) is set by the CONSUMER: the kit deliberately has no `loading` prop
//    sugar — a busy button is assembled from what already exists;
//  • expansion (`data-expanded`) and pressedness (`data-pressed`) arrive from an OUTER component
//    at composition time (`PWEB-25`): a button that becomes a popover trigger or a toggle carries
//    the button's own address — because visually it is a button — while the state itself belongs
//    to whoever owns that behavior.
//
// Leaving them undeclared would make it impossible for a skin to dress a busy button, an
// expanded trigger, or a pressed toggle AT ALL: a rule addressing an undeclared state is invalid.
// This does not break "the passport declares nothing unobservable" — the state IS observable,
// the component simply is not the one setting it, and each one is proven on a live composition.

import {
  defineSettings,
  definePassport,
} from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { ButtonProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** Passport of the button — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        {
          name: "focus-visible",
          mark: { kind: "pseudo", name: ":focus-visible" },
        },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
        {
          name: "disabled",
          mark: { kind: "attribute", name: "data-disabled" },
        },
        {
          name: "busy",
          mark: { kind: "attribute", name: "aria-busy", value: "true" },
        },
        {
          // The state name is the ADDRESS the skin looks it up by, and it outlives a kit swap:
          // the attribute is Kobalte's `data-expanded` today, the same thing is `data-state="open"`
          // in Zag's vocabulary. Markup changes; the name stays.
          name: "expanded",
          mark: { kind: "attribute", name: "data-expanded" },
        },
        { name: "pressed", mark: { kind: "attribute", name: "data-pressed" } },
      ],
    },
  ],
  variantAxis: {
    // No names live here and none ever will: a human creates them together with a skin. The
    // passport only declares that the axis EXISTS — one name, one attribute.
    mark: { kind: "attribute", name: "data-variant" },
  },
  // THE BUTTON HAS NO SETTINGS (`PWEB-89`), and this declares that as a fact, not an omission: an
  // empty `defineSettings<ButtonProps>` is a checkable claim that the button accepts none of the
  // closed settings vocabulary. Should one appear, the type forces it to be declared here.
  settings: defineSettings<ButtonProps>({}),
  // THE BUTTON'S OWN BEHAVIOR (`PWEB-167`): accept a label and a payload in ITS OWN data shape,
  // print the label, and on click hand the payload back out untouched. A component referencing
  // this button (an accordion item, a list row) supplies data in this shape — it does not repeat
  // this `on`/`children` on its own reference node, which would mean overriding the button's
  // behavior instead of feeding it (page 111 §5, page 112 §4).
  //
  // `bind` on `data-variant`, no literal `props` default: a reference feeds its own literal
  // `props`/`bind` in as DATA for this tree to read (`PWEB-169`), not as DOM props applied
  // directly — so a pass-through like the variant has to be named HERE to be visible at all. No
  // literal fallback is declared alongside it because the kit itself owns no variant name (see
  // `variantAxis` above: names are a human's call, made together with a skin) — the honest
  // default for an unfed variant is no attribute at all, the same as an ordinary unbound node.
  selfAssembly: {
    tree: {
      node: "root",
      bind: { "data-variant": "/data-variant" },
      on: {
        click: {
          event: { name: "select", context: { payload: { path: "/payload" } } },
        },
      },
      children: [{ genus: "text", value: { path: "/label" } }],
    },
  },
});
