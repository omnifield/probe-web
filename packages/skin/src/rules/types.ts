// Design notes: ./README.md#types

import type { StyleObject } from "../recipe/index.js";

export type SkinFlawName =
  | "unknown-component"
  | "unknown-part"
  | "unknown-state"
  | "unknown-setting"
  | "setting-unaddressable"
  | "view-unaddressable"
  | "unknown-ancestor"
  | "unknown-variant"
  | "default-missing"
  | "variant-unaddressable"
  | "unsafe-name"
  | "bad-seed"
  | "bad-size"
  | "unknown-value"
  | "variable-elsewhere"
  | "empty-value"
  | "free-selector"
  | "step-purpose-mismatch";

export interface SkinFlaw {
  readonly name: SkinFlawName;
  readonly where: string;
  readonly means: string;
}

export interface CssRule {
  readonly selector: string;
  readonly style: StyleObject;
  readonly conditions: number;
  readonly origin: number;
}

export interface RuleCoordinate {
  readonly component: string;
  readonly part: string;
  readonly variants: readonly string[];
  readonly settings?: Readonly<Record<string, string>>;
  readonly states: readonly string[];
  readonly ancestor?: {
    readonly component: string;
    readonly part: string;
    readonly states: readonly string[];
  };
}

export interface SkinRule extends CssRule {
  readonly coordinate: RuleCoordinate;
}

export interface SkinRules {
  readonly rules: readonly SkinRule[];
  readonly flaws: readonly SkinFlaw[];
}

export interface SketchRules {
  readonly rules: readonly CssRule[];
  readonly flaws: readonly SkinFlaw[];
}

export interface ValueVocabulary {
  readonly tokens?: Iterable<string>;
}
