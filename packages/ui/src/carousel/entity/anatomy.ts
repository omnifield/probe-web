// RUNTIME anatomy of the carousel (`ark-ui.com/docs/components/carousel`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// ## A second genuine exception to "always take anatomy from `@zag-js/<x>/anatomy`"
//
// `@zag-js/carousel/anatomy` declares TEN parts. Taking anatomy from there, the way every
// Zag-backed component in the kit normally does, would be INCOMPLETE here: Ark's own Solid
// components import a DIFFERENT, larger anatomy — `@ark-ui/solid`'s
// `src/components/carousel/carousel.anatomy.ts` does
// `zagCarouselAnatomy.extendWith("progressText", "autoplayIndicator")`, and `CarouselAutoplay
// Indicator` (`carousel-autoplay-indicator.tsx`) genuinely spreads `parts.autoplayIndicator.attrs`
// onto its node — a REAL, addressed part that plain `@zag-js/carousel` does not know about at
// all. Taking the ten-part version would silently drop a component the kit's own Solid layer
// actually addresses.
//
// The fix is the same one the field's own anatomy already stands on (`field/entity/anatomy.ts`):
// pull from `@ark-ui/solid/anatomy`, the package-level barrel, not the per-component
// `@ark-ui/solid/<component>/anatomy` subpath the accordion's header warns against. Verified the
// same way: `node -e "import('@ark-ui/solid/anatomy')…"` with no Solid condition active resolves
// the EXTENDED, eleven-part anatomy cleanly, no JSX in the chunk that builds it — one plain call
// to `.extendWith(...)` on top of the same `@zag-js/carousel` object.
//
// ELEVEN parts: `root · itemGroup · item · control · nextTrigger · prevTrigger · indicatorGroup ·
// indicator · autoplayTrigger · progressText · autoplayIndicator`. The last two Ark-only ones
// behave differently from the nine Zag-backed ones — see `passport.ts` and `../components/
// index.tsx`.

import { carouselAnatomy } from "@ark-ui/solid/anatomy";

/** Parts and addresses — taken, not ours. Eleven, and the map below covers them all. */
export const anatomy = carouselAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
