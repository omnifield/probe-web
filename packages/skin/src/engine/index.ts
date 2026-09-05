// Package surface: the whole skin mechanic — model, checks, coverage, and CSS generation.
//
// Generation hands out the NESTED form, and postcss is not pulled in at all from here: the browser
// unwraps nesting itself (Baseline Widely Available since June 11, 2026). The flat form is the
// `./flat` subpath.
//
// Whoever doesn't need even printing takes `./model`.

export * from "../model.js";

// BINDING TO THE PASSPORT SOURCE — the root one: the same model plus printing (`PWEB-94`). There
// are no free-standing `generateSkinCss` / `generateSketchCss` here anymore: while the source was
// an argument to every call, the signature allowed checking an outfit with one source and
// generating with another.
//
// One name for both entries is INTENTIONAL — the mechanic has one binder, and the entries split it
// along the same seam as everything else: whether printing lands in the consumer's bundle. The
// explicit export below SHADOWS the same-named one from `export *` above — that's how module
// re-exports work: named-by-hand outranks the star. Held by a surface test
// (`test/surface.test.ts`), not by calculation.
export { SkinRefused, withPassports, type BoundSkin } from "../generate/index.js";

// Contrast readability lives HERE, not in `./model`, and it's the same rule: entries split by what
// lands in the consumer's bundle. The contrast formula is taken from the values zone (otherwise
// "checked" would mean different things for us and for whoever brings their own brand), and that
// zone pulls in Solid. A storage layer that only needs the record's shape shouldn't pay for that.
export type {
  ContrastAddress,
  ContrastNote,
  ContrastQuestion,
  ContrastReport,
  UncheckedQuestion,
  UnreckonableReason,
} from "../contrast/index.js";
export { INDISTINCT, skinContrast } from "../contrast/index.js";
