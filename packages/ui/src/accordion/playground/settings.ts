import type { PassportSettingEditorInfo } from "@omnifield/probe-web-skin/editor";

export const settings: Readonly<Record<string, PassportSettingEditorInfo>> = {
  orientation: {
    means:
      "how items are laid out: top to bottom or left to right — this drives keyboard navigation and aria",
    options: {
      vertical: { means: "top to bottom" },
      horizontal: { means: "left to right" },
    },
  },
  multiple: { means: "whether several items can stay expanded at once" },
  collapsible: {
    means:
      "whether the last expanded item can be closed, leaving the whole accordion collapsed",
  },
};
