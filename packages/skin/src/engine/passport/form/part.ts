
import type { PassportMark } from "./mark.js";
import type { PassportState } from "./state.js";
import type { PassportVariable } from "./variable.js";

export interface PassportPart<Part extends string = string> {
  readonly name: Part;
  readonly states: readonly PassportState[];
  readonly variables?: readonly PassportVariable[];
}

export interface PassportVariantAxis {
  readonly mark: PassportMark;
}
