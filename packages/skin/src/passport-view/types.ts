// Design notes: ./README.md#types

export interface SkinAncestor {
  readonly component: string;
  readonly part: string;
  readonly states: readonly string[];
}

export interface SkinCoordinate {
  readonly component: string;
  readonly part: string;
  readonly states: readonly string[];
  readonly variant?: string;
  readonly ancestor?: SkinAncestor;
}
