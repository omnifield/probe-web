import type { IconProps } from "@web-core/ui";

type IconName = IconProps["name"];

export type ViewMode = "style" | "assembly" | "feed" | "form";
export const VIEW_MODES: readonly {
  readonly value: ViewMode;
  readonly icon: IconName;
}[] = [
  { value: "style", icon: "image" },
  { value: "assembly", icon: "folder" },
  { value: "feed", icon: "file-text" },
  { value: "form", icon: "pencil" },
];

export type LayoutMode = "matrix" | "grid";
export const LAYOUT_MODES: readonly {
  readonly value: LayoutMode;
  readonly icon: IconName;
}[] = [
  { value: "matrix", icon: "layout-grid" },
  { value: "grid", icon: "grid-3x3" },
];
export const DEFAULT_LAYOUT_MODE: LayoutMode = "grid";
