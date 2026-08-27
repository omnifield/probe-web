// TEMPLATE — structure prepared, no look written here.
//
// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every other component's `playground/recipe.ts` (`PWEB-127`): the file exists even before it
// holds a look.
//
// Six parts, the richest state surface any two-part pair (`group`/`root`) has needed in the kit —
// `root` alone carries 18 states (`../entity/passport.ts`). Left EMPTY for whoever fills the
// playground zone next; the dialog's own `playground/recipe.ts` is the nearest sibling for the
// open/closed + title/description/button shape, though nothing else in the kit shares toast's own
// stacking (`data-first`/`data-stack`) mechanics closely enough to name a second source.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    group: { props: {} },
    root: { props: {} },
    title: { props: {} },
    description: { props: {} },
    actionTrigger: { props: {} },
    closeTrigger: { props: {} },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "toast-sample", component: "toast", recipe };
