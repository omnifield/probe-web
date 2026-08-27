// RUNTIME anatomy of the field (`ark-ui.com/docs/components/field`) — the kit's first
// composition helper with NO backing `@zag-js` state machine at all.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// ## Where the anatomy actually comes from — a genuine exception to the usual rule
//
// Every OTHER component in the kit takes its anatomy from a `@zag-js/<component>/anatomy`
// subpath — a package with no Solid and no state machine, kept separate from `@ark-ui/solid` for
// exactly that reason. The field has no such package: it is not a Zag machine at all, only an
// Ark-level composition helper (`useField`, `@ark-ui/solid`'s own
// `src/components/field/field.anatomy.ts`), and there is no standalone `@zag-js/field` to pull
// from.
//
// The anatomy is instead taken from `@ark-ui/solid/anatomy` — a PACKAGE-LEVEL barrel (not the
// per-component `@ark-ui/solid/<component>/anatomy` subpath the accordion's own header warns
// against), whose `exports` map lists `"solid"` before `"default"` but resolves cleanly for a
// reader with no Solid condition active: checked directly (`node -e "import('@ark-ui/solid/
// anatomy')…"`, 2026-08-26) — the `"default"` condition points at a plain compiled chunk built by
// nothing more than `createAnatomy("field").parts(...)`, the same call every other component's
// anatomy makes, with zero JSX in it either way. This is the one place in the kit where
// `@ark-ui/solid` itself is the anatomy's source of truth, because for an Ark-only component
// there is no other truth to source it from.
//
// EIGHT parts: `root · label · input · select · textarea · helperText · errorText ·
// requiredIndicator`. `input`/`select`/`textarea` are THREE PARALLEL renderers for the same
// conceptual control — a consumer picks ONE matching the native element they actually want
// (`<input>`, `<select>`, or `<textarea>`); they are not meant to appear together.
//
// `Field.Item` carries NO part and is not in this anatomy at all — unlike every other
// unaddressed node in the kit (checkbox's hidden input, select's hidden select), `Item` does not
// even render its OWN DOM node: it is a pure Solid context-scoping helper (`field-item.tsx`,
// `@ark-ui/solid`) that renames ids for one repeated instance and passes `children` straight
// through. There is no node to give an address to.

import { fieldAnatomy } from "@ark-ui/solid/anatomy";

/** Parts and addresses — taken, not ours. Eight, and the map below covers them all. */
export const anatomy = fieldAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
