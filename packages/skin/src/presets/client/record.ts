import type { PresetKind } from "./kinds.js";

export interface PresetRecord<T> {
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly kind: PresetKind;
  readonly savedAt: string;
  readonly state: T;
}
