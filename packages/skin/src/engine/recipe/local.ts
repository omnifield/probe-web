
import type { StyleObject } from "./style.js";

export interface LocalStyle {
  readonly props?: StyleObject;
  readonly states?: Readonly<Record<string, LocalStyle>>;
}

export interface AncestorStyle {
  readonly component: string;
  readonly part: string;
  readonly states?: readonly string[];
  readonly style: LocalStyle;
}

export interface PartStyle extends LocalStyle {
  readonly ancestors?: readonly AncestorStyle[];
}

// `Partial`, не голый `Record<Part, PartStyle>`: настройка правит подмножество частей, не все.
// Побочный эффект — итерация несёт `| undefined` в типе элемента, хотя рантайм его не кладёт;
// три обходчика (`../rules/traverse/*`, `../look/references.ts`) отсеивают его на месте.
export type PartStyles<Part extends string = string> = Readonly<Partial<Record<Part, PartStyle>>>;
