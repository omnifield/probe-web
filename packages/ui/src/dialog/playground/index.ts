// EDITOR-ONLY metadata for the dialog. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// every other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract
// in `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`) and scenario data (`assemblies.ts`) live in their own files. No
// `settings.ts` — the dialog has no setting from the closed vocabulary (`../entity/passport.ts`).
//
// `genus`/`group` are real classifications, not prose: a plain component (`genus: "component"`);
// `group` is `overlays` — the same section the popover's/toast's own comment already settles on
// (`PWEB-34`), a dialog floats above the page exactly like the rest of that list, and it is not
// `disclosure` (accordion's own section: expand/collapse in place, not a floating panel).
// `footprint` is real too (`footprintOf`, `PWEB-31`): `"regular"` — a modal has real content
// (title, description, a body the consumer fills), unlike the popover's own small floating
// bubble (`"compact"`), but it does not need the FULL gallery row the way a table's own grid
// does (`"wide"`) — the middle default is the honest fit, not a placeholder.

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
    means: "the variant name a human gives the dialog in the editor; the kit passes it through untouched",
  },
  parts,
  assemblies,
});
