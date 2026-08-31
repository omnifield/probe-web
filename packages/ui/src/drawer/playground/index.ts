// EDITOR-ONLY metadata for the drawer. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// every other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract
// in `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`) and scenario data (`assemblies.ts`) live in their own files. No
// `settings.ts` — the drawer has no setting from the closed vocabulary (`../entity/passport.ts`:
// `swipeDirection` is real but ineligible by name).
//
// `genus`/`group` are real classifications, not prose: a plain component (`genus: "component"`);
// `group` is `overlays` — the dialog's own section (`PWEB-34`), since a drawer is a sliding modal,
// not something that expands in place. `footprint` is real too (`footprintOf`, `PWEB-31`):
// `"regular"` — the same middle bracket the dialog's own modal panel sits in, the same reasoning
// (real content, but not inherently full-row the way a table's grid is).

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  group: "overlays",
  footprint: "regular",
  variantAxis: {
    means: "the variant name a human gives the drawer in the editor; the kit passes it through untouched",
  },
  parts,
  assemblies,
});
