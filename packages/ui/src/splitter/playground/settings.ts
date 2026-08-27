// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY setting prose for the splitter — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as the carousel's/accordion's/tabs' own `playground/settings.ts`:
// `orientation` is the one name from the closed `SETTINGS` vocabulary that intersects the
// splitter's own props (`../entity/passport.ts`) — same name, same mark (`data-orientation`).
//
// WHAT IS A PLACEHOLDER: every `means: "TODO"` — human-facing prose, left for whoever fills the
// playground zone next.

import type { PassportSettingEditorInfo } from "@omnifield/probe-web-skin/editor";

export const settings: Readonly<Record<string, PassportSettingEditorInfo>> = {
  orientation: {
    means: "TODO",
    options: {
      horizontal: { means: "TODO" },
      vertical: { means: "TODO" },
    },
  },
};
