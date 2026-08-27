// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY metadata for the splitter. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// every other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract
// in `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`), scenario data (`assemblies.ts`), and setting prose (`settings.ts`) live
// in their own files. `settings.ts` exists here — unlike most of this wave — because `orientation`
// is a real setting from the closed vocabulary (`../entity/passport.ts`).
//
// `genus`/`group` are real classifications, not prose, and are filled in: a plain component
// (`genus: "component"`); `group` is left `other`, the same open question the tree view's/
// toggle's own comment already names (`PWEB-34`) — a splitter is not `disclosure` and no
// better-fitting section exists yet. `footprint` is real too (`footprintOf`, `PWEB-31`): `"wide"`
// — a layout primitive that needs real screen space to show two or more resizable panes at once,
// the same bracket the tree view's/table's/carousel's own footprint already claims.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";
import { settings } from "./settings.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  footprint: "wide",
  variantAxis: {
    means: "TODO",
  },
  parts,
  settings,
  assemblies,
});
