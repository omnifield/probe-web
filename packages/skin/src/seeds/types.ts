// Design notes: ./README.md#types

import type { ScaleMode } from "@omnifield/probe-web-style";

export type SkinHalf = ScaleMode;

export type ValueOrigin = "seed" | "literal";

export interface SkinValue {
  readonly value: string;
  readonly from: ValueOrigin;
  readonly scale?: string;
  readonly step?: string;
}
