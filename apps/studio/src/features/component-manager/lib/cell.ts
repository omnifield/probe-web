import type { NativeStyle } from "@web-core/skin";
import type { ComponentFootprint } from "@web-core/skin/editor";

export interface Cell {
  readonly index: number;

  readonly id: string;
}

const CELL_SIZES = {
  compact: { height: "16rem", "overflow-y": "auto" },
  regular: { height: "24rem", "overflow-y": "auto" },
  wide: { height: "32rem", "overflow-y": "auto" },
} as const satisfies Record<ComponentFootprint, NativeStyle>;

export function cellSize(footprint?: ComponentFootprint): NativeStyle {
  return CELL_SIZES[footprint ? footprint : "compact"];
}
