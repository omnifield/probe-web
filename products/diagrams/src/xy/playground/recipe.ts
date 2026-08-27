// TEMPLATE — structure prepared, no look written here.
//
// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every kit component's `playground/recipe.ts` (`PWEB-127`).
//
// Two parts so far. Left EMPTY for whoever fills the playground zone next.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: { props: {} },
    axis: { props: {} },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "xy-sample", component: "xy", recipe };
