// TEMPLATE — structure prepared, no look written here.
//
// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every other component's `playground/recipe.ts` (`PWEB-127`): the file exists even before it
// holds a look.
//
// Four parts. `resizeTrigger` needs real width/height along the cross-axis to be grabbable at all
// (`cursor: col-resize`/`row-resize` alone does not give it a hit area) — the nearest sibling for
// that mechanic is the scroll area's own `scrollbar`/`thumb`, not a border. Left EMPTY for
// whoever fills the playground zone next.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: { props: {} },
    panel: { props: {} },
    resizeTrigger: { props: {} },
    resizeTriggerIndicator: { props: {} },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "splitter-sample", component: "splitter", recipe };
