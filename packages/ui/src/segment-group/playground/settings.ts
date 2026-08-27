// EDITOR-ONLY setting prose for the segment group — read by `./index.ts`'s `defineEditorInfo`
// call. Same shape, name, mark, and default as the radio group's own (same machine, `PWEB-134`).

import type { PassportSettingEditorInfo } from "@omnifield/probe-web-skin/editor";

export const settings: Readonly<Record<string, PassportSettingEditorInfo>> = {
  orientation: {
    means: "which way the segments lay out — also drives keyboard navigation (arrow keys)",
    options: {
      horizontal: { means: "segments in a row" },
      vertical: { means: "segments in a column — the default" },
    },
  },
};
