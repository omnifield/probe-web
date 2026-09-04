// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY metadata for the xy family. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// every kit component: `defineEditorInfo` depends one-way on `passport`.
//
// THIN on purpose, the same physical shape as every kit component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`) and scenario data (`assemblies.ts`) live in their own files. No
// `settings.ts` — the xy family has no setting from the closed vocabulary (`../entity/
// passport.ts`'s own file header explains why `axis`'s orientation is not one).
//
// `genus`/`group` are real classifications: a plain component (`genus: "component"`); `group`
// is left `other` — the kit's own open question (`PWEB-34`) applies here too, and `diagrams` has
// no group vocabulary of its own yet. `footprint` is real (`footprintOf`, `PWEB-31`): `"wide"` —
// a coordinate system needs real screen space, the same bracket the kit's own table/tree-view/
// splitter footprint already claims.

import { defineEditorInfo } from "@web-core/skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@web-core/diagrams",
  genus: "component",
  footprint: "wide",
  variantAxis: {
    means: "TODO",
  },
  parts,
  assemblies,
});
