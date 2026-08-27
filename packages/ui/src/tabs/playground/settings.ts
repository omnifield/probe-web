// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY setting prose for tabs — read by `./index.ts`'s `defineEditorInfo` call. Same
// physical shape as the accordion's own `playground/settings.ts`: `orientation` is the one name
// from the closed `SETTINGS` vocabulary that intersects tabs' own props (`../entity/passport.ts`)
// — same name, same mark (`data-orientation`) as the accordion's.

import type { PassportSettingEditorInfo } from "@omnifield/probe-web-skin/editor";

export const settings: Readonly<Record<string, PassportSettingEditorInfo>> = {
  orientation: {
    means: "which way the tabs lay out — drives keyboard navigation (arrow keys) and aria, not just the look",
    options: {
      horizontal: { means: "tabs in a row, panel below" },
      vertical: { means: "tabs in a column, panel beside them" },
    },
  },
};
