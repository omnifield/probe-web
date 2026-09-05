
import type { PassportMark } from "./mark.js";

export interface PassportState {
  readonly name: string;
  readonly mark: PassportMark;
  readonly absentWhen?: string;
}

export function addressesView(state: PassportState): boolean {
  return state.absentWhen === undefined;
}
