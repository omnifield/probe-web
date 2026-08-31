// EDITOR-ONLY metadata for the avatar. Human-facing text, taxonomy, and nesting rules for the
// visual editor and for agents reading the catalog — never for the running app. Same split as
// every other component: `defineEditorInfo` depends one-way on `passport` (the runtime contract
// in `../entity/passport.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// THIN on purpose, the same physical shape as every other component's `playground/` (`PWEB-127`):
// taxonomy (`parts.ts`) and scenario data (`assemblies.ts`) live in their own files. No
// `settings.ts` — the avatar has no setting from the closed vocabulary (`../entity/passport.ts`).
//
// `genus`/`group` are real classifications, not prose: a plain component (`genus: "component"`);
// `group` is `other`, the same open question the tabs'/table's/dialog's/scroll area's own comment
// already names (`PWEB-34`) — an avatar is not `disclosure` and no better-fitting section exists
// yet. `footprint` is real too (`footprintOf`, `PWEB-31`): `"compact"` — a small atom, the same
// bracket the icon/checkbox already sit in, not the middle default a structural component gets.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  group: "other",
  footprint: "compact",
  variantAxis: {
    means: "the variant name a human gives the avatar in the editor; the kit passes it through untouched",
  },
  parts,
  assemblies,
});
