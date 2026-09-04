import { RESET_PROOF } from "../css/written.js";

export interface BaseMarker {
  readonly property: string;
  readonly value: string;
  toString(): string;
}

export const BASE_MARKER: BaseMarker = Object.freeze({
  property: RESET_PROOF.property,
  value: RESET_PROOF.value,
  toString: () => RESET_PROOF.property,
});
