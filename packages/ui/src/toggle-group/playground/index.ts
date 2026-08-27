// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY metadata for the toggle group. Human-facing text, taxonomy, and nesting rules for
// the visual editor and for agents reading the catalog — never for the running app. Same split as
// every other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract in
// `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`), setting prose (`settings.ts`), and scenario data (`assemblies.ts`) live
// in their own files.
//
// `genus`/`group` are real classifications, not prose, and are filled in: a plain component
// (`genus: "component"`), grouped with the checkbox/switch/radio-group as an input —
// `group: "inputs"`, the same rationale (a set the user presses to choose one or several values).
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
  group: "inputs",
  footprint: "compact",
  variantAxis: {
    means: "the variant name a human gives the toggle group in the editor; the kit passes it through untouched",
  },
  parts,
  settings,
  assemblies,
});
