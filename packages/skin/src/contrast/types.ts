// Design notes: ./README.md#types

import type { ColorRefusal } from "@web-core/style";
import type { RuleCoordinate } from "../rules/index.js";
import type { SkinHalf } from "../seeds/index.js";

export type ContrastQuestion = "text" | "non-text" | "distinct";

export type UnreckonableReason = "no-background" | "outside-skin" | ColorRefusal;

export type ContrastAddress = Pick<RuleCoordinate, "component" | "part" | "variants" | "states">;

export type ContrastNote =
  | {
      readonly kind: "low";
      readonly half: SkinHalf;
      readonly where: ContrastAddress;
      readonly property: string;
      readonly question: "text" | "non-text";
      readonly foreground: string;
      readonly background: string;
      readonly ratio: number;
      readonly required: number;
      readonly means: string;
    }
  | {
      readonly kind: "indistinct";
      readonly half: SkinHalf;
      readonly where: ContrastAddress;
      readonly property: string;
      readonly question: "distinct";
      readonly foreground: string;
      readonly background: string;
      readonly ratio: number;
      readonly means: string;
    }
  | {
      readonly kind: "unreckonable";
      readonly half: SkinHalf;
      readonly where: ContrastAddress;
      readonly property: string;
      readonly question: ContrastQuestion;
      readonly reason: UnreckonableReason;
      readonly means: string;
    };

export interface UncheckedQuestion {
  readonly question: string;
  readonly properties: readonly string[];
  readonly means: string;
}

export interface ContrastReport {
  readonly notes: readonly ContrastNote[];
  readonly unchecked: readonly UncheckedQuestion[];
}
