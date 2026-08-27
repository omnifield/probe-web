// TEMPLATE — structure prepared, no look written here.
//
// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every other component's `playground/recipe.ts` (`PWEB-127`): the file exists even before it
// holds a look.
//
// Ten parts, one shared group-level dictionary on five of them (`../entity/passport.ts`). Left
// EMPTY for whoever fills the playground zone next; `thumb`'s own positioning depends entirely on
// `root`'s own `--slider-thumb-offset-N` variables, which the passport model cannot name (the
// file header's own "one family of dynamic ones is not" section) — a recipe still has to
// position `thumb` from those unnamed custom properties directly, the same way the connector's
// own `slider.style.mjs` does, not something a `SlotRecipe`'s own `props`/`states` shape can
// route around.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: { props: {} },
    label: { props: {} },
    valueText: { props: {} },
    control: { props: {} },
    track: { props: {} },
    range: { props: {} },
    thumb: { props: {} },
    markerGroup: { props: {} },
    marker: { props: {} },
    draggingIndicator: { props: {} },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "slider-sample", component: "slider", recipe };
