// TEMPLATE — structure prepared, no look written here.
//
// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every other component's `playground/recipe.ts` (`PWEB-127`): the file exists even before it
// holds a look.
//
// Two parts, tied with avatar's for the smallest state surface in the kit (`../entity/
// passport.ts`) — both parts carry the identical four-state set. Left EMPTY for whoever fills the
// playground zone next; the toggle group's own `item` (a button that flips a boolean-ish fact on
// click) is the nearest sibling for the mechanics, though the toggle's own root is a single
// standalone control, not one of a set.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: { props: {} },
    indicator: { props: {} },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "toggle-sample", component: "toggle", recipe };
