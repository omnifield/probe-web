// EDITOR-ONLY metadata for the toast. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// every other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract
// in `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`) and scenario data (`assemblies.ts`) live in their own files. No
// `settings.ts` — the toast has no setting from the closed vocabulary (`../entity/passport.ts`:
// `placement` is real but store-level and ineligible by name).
//
// `genus`/`group` are real classifications, not prose: a plain component (`genus: "component"`);
// `group` (the catalog section, not the anatomy part of the same name) is `overlays` — the
// popover's/menu's own section, "windows, panels, tooltips, menus," and a toast floats above the
// page exactly like the rest of that list (`PWEB-34`). `footprint` is real too (`footprintOf`,
// `PWEB-31`): `"compact"` — a small floating notification, the popover's own bracket.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  group: "overlays",
  footprint: "compact",
  variantAxis: {
    means: "the variant name a human gives the toast in the editor; the kit passes it through untouched",
  },
  parts,
  assemblies,
});
