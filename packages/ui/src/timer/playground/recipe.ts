// TEMPLATE — structure prepared, no look written here.
//
// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every other component's `playground/recipe.ts` (`PWEB-127`): the file exists even before it
// holds a look.
//
// Eight parts, four of them (`root`/`area`/`control`/`separator`) entirely stateless
// (`../entity/passport.ts`). Left EMPTY for whoever fills the playground zone next; the plain
// button's own recipe is the nearest sibling for `actionTrigger`'s pseudo-class trio, nothing
// else in the kit is close enough in shape for the `item`/`itemLabel`/`itemValue` half.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: { props: {} },
    area: { props: {} },
    control: { props: {} },
    item: { props: {} },
    itemLabel: { props: {} },
    itemValue: { props: {} },
    actionTrigger: { props: {} },
    separator: { props: {} },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "timer-sample", component: "timer", recipe };
