export type ViewMode = "style" | "assembly" | "feed" | "form";
export const VIEW_MODES: readonly ViewMode[] = [
  "style",
  "assembly",
  "feed",
  "form",
];

export type LayoutMode = "matrix" | "grid";
export const LAYOUT_MODES: readonly LayoutMode[] = ["matrix", "grid"];
export const DEFAULT_LAYOUT_MODE: LayoutMode = "grid";
