// EDITOR-ONLY setting prose for the select — read by `./index.ts`'s `defineEditorInfo` call
// (split out `PWEB-127`). Same physical shape as the accordion's own `playground/settings.ts`,
// one entry instead of three: `multiple` is the only name from the closed `SETTINGS` vocabulary
// that intersects the select's own props (`../entity/passport.ts`).

import type { PassportSettingEditorInfo } from "@omnifield/probe-web-skin/editor";

export const settings: Readonly<Record<string, PassportSettingEditorInfo>> = {
  multiple: { means: "whether several items can be selected at once" },
};
