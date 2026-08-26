// RUNTIME anatomy of the button (`PWEB-2`, decomposed `PWEB-124`, `PWEB-127`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, same split as the accordion's
// `entity/anatomy.ts`. The fuller runtime contract — states, the variant axis, settings, the
// `definePassport` call that ties them together — lives one level up, in `passport.ts`, which
// imports `anatomy` from here. Editor-facing metadata is a further step removed, in
// `playground/index.ts`.
//
// Declared with the SAME function used by all 51 ready-made Ark anatomies — `createAnatomy`. One
// declaration gives both sides of the contract: the `attrs` the kit puts on the node, and the
// `selector` the skin hooks into.

import { createAnatomy } from "@omnifield/probe-web-skin/model";

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
export const anatomyParts = anatomy.build();
