// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY metadata for the slider. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// every other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract
// in `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`), setting prose (`settings.ts`), and scenario data (`assemblies.ts`) live
// in their own files.
//
// `genus`/`group` are real classifications, not prose, and are filled in: a plain component
// (`genus: "component"`), grouped with the checkbox/switch/radio-group/segment-group/date-picker/
// file-upload as an input — `group: "inputs"`, the same rationale. `footprint` is real too
// (`footprintOf`, `PWEB-31`): `"regular"` — a slider has real width/height to show its own track
// and thumb travel, but is not a component that claims the full gallery row the way a table does.
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
  footprint: "regular",
  variantAxis: {
    means: "TODO",
  },
  parts,
  settings,
  assemblies,
});
