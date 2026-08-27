// TEMPLATE — structure prepared, no look written here.
//
// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every other component's `playground/recipe.ts` (`PWEB-127`): the file exists even before it
// holds a look.
//
// Ten parts, the richest variable surface in the kit (`../entity/passport.ts`): `content` alone
// carries eleven measured custom properties driving its own slide/drag transform. Left EMPTY for
// whoever fills the playground zone next; the dialog's own `playground/recipe.ts` is the nearest
// sibling for the open/closed + trigger/backdrop half, but the slide/swipe transform mechanics
// have no close sibling anywhere else in the kit yet.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    positioner: { props: {} },
    content: { props: {} },
    title: { props: {} },
    description: { props: {} },
    trigger: { props: {} },
    backdrop: { props: {} },
    grabber: { props: {} },
    grabberIndicator: { props: {} },
    closeTrigger: { props: {} },
    swipeArea: { props: {} },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "drawer-sample", component: "drawer", recipe };
