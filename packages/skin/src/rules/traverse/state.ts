// Design notes: ../README.md#state

import type { PassportLookup } from "../../address/index.js";
import type { ComponentPassport, PassportState } from "../../passport/form/index.js";
import type { StyleObject } from "../../recipe/index.js";
import type { VariableHome } from "../../variables/index.js";
import type { CssRule, RuleCoordinate } from "../types.js";
import type { Flaws } from "../flaws.js";

export interface Walk<Mark> {
  readonly lookup: PassportLookup;
  readonly known: Set<string>;
  readonly homes: Map<string, VariableHome[]>;
  readonly flaws: Flaws;
  readonly out: (CssRule & Mark)[];
  mark(cursor: Cursor): Mark;
}

export interface UnreliableMark {
  readonly component: string;
  readonly part: string;
  readonly state: PassportState;
}

export interface Cursor {
  readonly passport: ComponentPassport;
  readonly part: string;
  readonly known: Set<string>;
  readonly own: string;
  readonly prefix: string;
  readonly variants: readonly string[];
  readonly settings?: Readonly<Record<string, string>>;
  readonly states: readonly string[];
  readonly unreliable: readonly UnreliableMark[];
  readonly ancestor?: RuleCoordinate["ancestor"];
  readonly conditions: number;
  readonly origin: number;
}

export interface Variant {
  readonly selector: string;
  readonly names: readonly string[];
  readonly settings?: Readonly<Record<string, string>>;
}

export const ANY_VARIANT: Variant = { selector: "", names: [] };

export function coordinateOf(cursor: Cursor): { coordinate: RuleCoordinate } {
  return {
    coordinate: {
      component: cursor.passport.component,
      part: cursor.part,
      variants: cursor.variants,
      states: cursor.states,
      ...(cursor.settings ? { settings: cursor.settings } : {}),
      ...(cursor.ancestor ? { ancestor: cursor.ancestor } : {}),
    },
  };
}

export function declares(style: StyleObject): boolean {
  return Object.values(style).some((value) => value !== undefined);
}
