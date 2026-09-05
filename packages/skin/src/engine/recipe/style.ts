
export type StyleValue = string | number;

export interface StyleObject {
  readonly [property: string]: StyleValue | StyleObject | undefined;
}
