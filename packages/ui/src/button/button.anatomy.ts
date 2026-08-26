// RUNTIME contract of the button (`PWEB-2`, decomposed `PWEB-124`).
//
// The button is the kit's first OWN component: Ark UI ships none, because a headless button is
// just a native element — there is nothing to wrap. That makes it the natural place to prove the
// whole mechanism: if the contract fits a component that does not exist in a borrowed kit, it
// fits anything.
//
// THIS FILE IS RUNTIME ONLY. It ships in the app bundle, so it carries exactly what the DOM
// needs to be styled and nothing a human or an editor needs to be told: no `means`, no group, no
// nesting rules, no assembly templates. That belongs to `button.editor.ts` — see its header for
// why editor-facing metadata is kept out of here (short version: it is the same reason Storybook
// keeps `argTypes`/docs in `*.stories.tsx`, not in the component itself).
//
// Declared with the SAME function used by all 51 ready-made Ark anatomies — `createAnatomy`. One
// declaration gives both sides of the contract: the `attrs` the kit puts on the node, and the
// `selector` the skin hooks into.

import { createAnatomy, defineSettings, definePassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time, so the `./button` subpath stays Solid-free.
// Needed so the setting keys are checked against the component's real props.
import type { ButtonProps } from "./button.jsx";

/**
 * Parts of the button.
 *
 * There is exactly ONE part, and that is accurate: the button renders a single node — the
 * label, icon, and any indicator are the consumer's own nodes, and this component makes no
 * promise about them. Should the button ever need an internal part of its own, it is declared
 * here and gets an address the same way.
 */
export const anatomy = createAnatomy("button").parts("root");

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const parts = anatomy.build();

/**
 * Passport of the button — anatomy plus what anatomy alone does not say.
 *
 * Seven states, three of them pseudo-classes. That is accurate: the button does not store
 * hover, focus, or press — the browser does, and declaring them as an attribute would be a lie
 * in the data. The button attribute-marks exactly one thing itself — disabledness: a disabled
 * button has neither `:hover` nor `:active`, and without `data-disabled` that state would be
 * invisible from the outside.
 *
 * The remaining three attributes are NOT set by the button, and that is not a gap — it follows
 * from two decisions:
 *
 *  • busyness (`aria-busy`) is set by the CONSUMER: the kit deliberately has no `loading` prop
 *    sugar — a busy button is assembled from what already exists;
 *  • expansion (`data-expanded`) and pressedness (`data-pressed`) arrive from an OUTER component
 *    at composition time (`PWEB-25`): a button that becomes a popover trigger or a toggle carries
 *    the button's own address — because visually it is a button — while the state itself belongs
 *    to whoever owns that behavior.
 *
 * Leaving them undeclared would make it impossible for a skin to dress a busy button, an
 * expanded trigger, or a pressed toggle AT ALL: a rule addressing an undeclared state is invalid.
 * This does not break "the passport declares nothing unobservable" — the state IS observable,
 * the component simply is not the one setting it, and each one is proven on a live composition.
 */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
        { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } },
        { name: "busy", mark: { kind: "attribute", name: "aria-busy", value: "true" } },
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
});
