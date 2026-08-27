// EDITOR-ONLY metadata for the select. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// the accordion and the button: `defineEditorInfo` depends one-way on `passport` (the runtime
// contract in `../entity/passport.ts`), and nothing flows back, so a production bundle that
// never imports `/editor` never pays for a single word written below.
//
// THIN on purpose: taxonomy (`parts.ts`), setting prose (`settings.ts`), and scenario data
// (`assemblies.ts`, empty as it is) live in their own files — the same physical shape as every
// other component's `playground/`, fifteen parts included.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";
import { settings } from "./settings.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  group: "inputs",
  footprint: "regular",
  variantAxis: {
    means: "the variant name a human gives the select in the editor; the kit passes it through untouched",
  },
  parts,
  settings,
  assemblies,
});
