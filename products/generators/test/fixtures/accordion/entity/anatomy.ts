// RUNTIME anatomy of the accordion (`PWEB-37`, decomposed `PWEB-124`) — the kit's first
// composite component.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else. That is the actual meaning of
// "anatomy" in Zag/Ark's own vocabulary: their `anatomy.ts` never carries states, settings, or a
// passport, only the part declarations a component is built from. The fuller runtime contract —
// per-part STATES, the variant axis, SETTINGS, the `definePassport` call that ties them together
// — lives one level up, in `passport.ts`, which imports `anatomy` from here. Naming a
// passport call an "anatomy" export was the mix-up this split corrects. Editor-facing metadata
// (`means`, group, genus, nesting/`accepts` rules, assembly templates) is a further step removed,
// in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made with the component. A component taken
// from Ark brings its own passport with it — rewriting it would create a second declaration of
// the same thing and drift from the provider on its very next release.
//
// ## Where the anatomy actually comes from — and why not `@ark-ui/solid/anatomy`
//
// It physically lives in `@zag-js/accordion/anatomy` — a subpath with no Solid and no state
// machine, only the part declarations. Ark's own `accordionAnatomy` comes from that SAME place,
// i.e. it is the same object, not a second copy of it.
//
// Taking it through Ark would be shorter and WRONG, as a live neighbor found out: the
// `@ark-ui/solid/anatomy` subpath has a `solid` branch with a `.jsx` file, and a passport reader
// whose resolver understands that branch (`packages/assembly` does) gets JSX where it expected
// data, and fails with "Unknown file extension .jsx". The `./passport` subpath is sold as DATA,
// readable without Solid — so it must be taken from a place that has no Solid at all.

import { anatomy as accordionAnatomy } from "@zag-js/accordion/anatomy";

/** Parts and addresses — taken, not ours. */
export const anatomy = accordionAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
