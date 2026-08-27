// TEMPLATE — structure prepared, no look written here.
//
// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every other component's `playground/recipe.ts` (`PWEB-127`): the file exists even before it
// holds a look.
//
// Seven parts (`../entity/passport.ts`): `trigger`/`backdrop`/`content` share `open`/`closed` on
// `data-state`; `trigger`/`closeTrigger` are genuine buttons (pseudo-class trio only, no data
// marks on `closeTrigger` at all); `positioner`/`title`/`description` carry no states. Left EMPTY
// for whoever fills the playground zone next; the popover's own `playground/recipe.ts` is the
// nearest sibling (same open/closed pair, same button-trigger shape) — MINUS its floating-UI
// positioning: this dialog centers with plain CSS, no popper variables to key off.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    trigger: { props: {} },
    backdrop: { props: {} },
    positioner: { props: {} },
    content: { props: {} },
    title: { props: {} },
    description: { props: {} },
    closeTrigger: { props: {} },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "dialog-sample", component: "dialog", recipe };
