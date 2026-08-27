// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY metadata for tabs. Human-facing text, taxonomy, and nesting rules for the visual
// editor and for agents reading the catalog — never for the running app. Same split as every
// other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract in
// `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`), setting prose (`settings.ts`), and scenario data (`assemblies.ts`) live
// in their own files.
//
// `genus`/`group` are real classifications, not prose, and are filled in: tabs is a plain
// component (`genus: "component"`), and gets its own place in the catalog — not `disclosure`
// (that section is the accordion's: expand/collapse, not switch-between), and not `navigation`
// (tabs switch CONTENT within one view, they do not navigate to a different one) — `other` for
// now, the honest umbrella until a decision names a section for it (`PWEB-34`).
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
  footprint: "regular",
  variantAxis: {
    means: "the variant name a human gives the tabs in the editor; the kit passes it through untouched",
  },
  parts,
  settings,
  assemblies,
});
