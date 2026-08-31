// Design notes: ./README.md#sketch

import type { PartStyle } from "./local.js";

export interface SketchEdit {
  readonly node: string;
  readonly component: string;
  readonly part: string;
  readonly style: PartStyle;
}
