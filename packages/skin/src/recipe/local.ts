// Design notes: ./README.md#local

import type { StyleObject } from "./style.js";

export interface LocalStyle {
  readonly props?: StyleObject;
  readonly states?: Readonly<Record<string, LocalStyle>>;
}

export interface AncestorStyle {
  readonly component: string;
  readonly part: string;
  readonly states?: readonly string[];
  readonly style: LocalStyle;
}

export interface PartStyle extends LocalStyle {
  readonly ancestors?: readonly AncestorStyle[];
}

// `Partial`, not a bare `Record<Part, PartStyle>`: a settings override (accordion's
// `orientation.horizontal`, `packages/ui/src/accordion/playground/recipe.ts`) rules a SUBSET of
// parts on purpose — forcing every `Part` present would demand a no-op entry for every part a
// setting doesn't touch (`PWEB-206`).
//
// Side effect worth knowing before touching `../rules/traverse/`: TS models an optional STRING
// index the only way it can — by widening the value type to `PartStyle | undefined`, even for the
// default `Part = string`. `Object.entries`/`Object.values` on a `PartStyles` therefore carry
// `| undefined` in their element type, though no traversal ever actually stores `undefined` — the
// three call sites that iterate one (`../rules/traverse/part.ts`, `../rules/traverse/recipe.ts`,
// `../look/references.ts`) narrow it away with a plain `if (style === undefined) continue`.
export type PartStyles<Part extends string = string> = Readonly<Partial<Record<Part, PartStyle>>>;
