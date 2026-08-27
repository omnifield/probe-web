// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY metadata for the toggle. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// every other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract
// in `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`) and scenario data (`assemblies.ts`) live in their own files. No
// `settings.ts` — the toggle has no setting from the closed vocabulary (`../entity/passport.ts`).
//
// `genus`/`group` are real classifications, not prose, and are filled in: a plain component
// (`genus: "component"`); `group` is left `other`, the same open question the avatar's/table's/
// tree view's own comment already names (`PWEB-34`) — a toggle is not `disclosure` and no
// better-fitting section exists yet. `footprint` is real too (`footprintOf`, `PWEB-31`):
// `"compact"` — a single small button, the same bracket the avatar/icon/checkbox already sit in.
// `variantAxis.means` is prose — left as "TODO" for whoever fills the playground zone next, same
// as every state's `means` in `parts.ts`.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  footprint: "compact",
  variantAxis: {
    means: "TODO",
  },
  parts,
  assemblies,
});
