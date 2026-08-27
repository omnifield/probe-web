// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY metadata for the carousel. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// every other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract
// in `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`), setting prose (`settings.ts`), and scenario data (`assemblies.ts`) live
// in their own files.
//
// `genus` is a real classification, not prose, and is filled in (`component`). `group` is left
// UNSET on purpose, the same call the tabs' own template makes: none of `disclosure`/
// `navigation`/`feedback`/`layout` honestly fits a component that pages through a set of slides —
// `other` (the working default, `groupOf`) until a decision names a section for it (`PWEB-34`).
// `variantAxis.means` is prose — left as "TODO" for whoever fills the playground zone next, same
// as every state's `means` in `parts.ts`.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";
import { settings } from "./settings.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  // Needs the row to itself by nature — it pages through slides, and a narrow column would hide
  // the one thing it does (`footprintOf`, `PWEB-31`).
  footprint: "wide",
  variantAxis: {
    means: "the variant name a human gives the carousel in the editor; the kit passes it through untouched",
  },
  parts,
  settings,
  assemblies,
});
