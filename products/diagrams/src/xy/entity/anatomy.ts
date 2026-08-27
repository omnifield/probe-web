// RUNTIME anatomy of the xy family (cartesian diagrams) — the product's first own compound
// component, the same standing the kit's own `table` has (`packages/ui/src/table/entity/
// anatomy.ts`): no upstream anatomy to take, because no headless library ships one at all (no
// `@zag-js/*` chart package exists, and Ark UI's own component list has no "chart"/"diagram"
// entry — checked 2026-08-26, `mcp__ark-ui__list_components`). Declared with the SAME function
// every ready-made Ark anatomy in the kit uses — `createAnatomy` — re-exported through
// `@omnifield/probe-web-skin/model`, framework/machine-agnostic on its own.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every anatomy file
// in the kit. The fuller runtime contract — per-part STATES — lives one level up, in
// `passport.ts`. Editor-facing metadata is a further step removed, in `playground/index.ts`.
//
// TWO parts so far, not the family's full shape: `root · axis`. `line`/`area`/`bar`/`point`
// (the roadmap's own series layers, Diagrams workspace, milestone 2) are NOT declared yet — an
// anatomy part is a promise about what is REAL on the DOM, verified against actually-built,
// actually-tested code, the same discipline every kit passport already follows ("every mark was
// read from the real connector, not invented" — here, "the real connector" is our own component,
// since we author both sides). Adding a series layer later is a normal, expected anatomy
// revision, not a redesign: `createAnatomy(...).parts(...)` grows the same way `table`'s own
// nine parts were declared once, together, when all nine were actually built — this component
// grows incrementally instead because each series layer is independently useful and independently
// verified.

import { createAnatomy } from "@omnifield/probe-web-skin/model";

/** Parts of the xy family so far: the coordinate system alone, no series layer yet. */
export const anatomy = createAnatomy("xy").parts("root", "axis");

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
