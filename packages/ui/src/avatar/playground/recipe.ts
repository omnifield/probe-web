// TEMPLATE — structure prepared, no look written here.
//
// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every other component's `playground/recipe.ts` (`PWEB-127`): the file exists even before it
// holds a look.
//
// Three parts, the smallest state surface in the kit (`../entity/passport.ts`): `root` has none
// at all; `image`/`fallback` share one opposite-polarity `visible`/`hidden` pair. Left EMPTY for
// whoever fills the playground zone next; the checkbox's own `indicator` (shown/hidden by the
// same kind of shared boolean) is the nearest sibling for the mechanics, though the avatar's own
// `root` typically wants a fixed circular/square size and `overflow: hidden`, which nothing else
// in the kit quite needs the same way.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: { props: {} },
    image: { props: {} },
    fallback: { props: {} },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "avatar-sample", component: "avatar", recipe };
