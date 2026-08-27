// EDITOR-ONLY setting prose for the radio group — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as the tabs' own `playground/settings.ts`: `orientation` is the one name
// from the closed `SETTINGS` vocabulary that intersects the radio group's own props (`../entity/
// passport.ts`) — same name, same mark (`data-orientation`), a DIFFERENT default (`"vertical"`).

import type { PassportSettingEditorInfo } from "@omnifield/probe-web-skin/editor";

export const settings: Readonly<Record<string, PassportSettingEditorInfo>> = {
  orientation: {
    means: "which way the choices stack — also drives keyboard navigation (arrow keys)",
    options: {
      horizontal: { means: "choices in a row" },
      vertical: { means: "choices in a column — the default" },
    },
  },
};
