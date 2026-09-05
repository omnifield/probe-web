
import type { PassportAssemblyElement } from "./nodes.js";

// `Data` — io-схема сборки, по умолчанию `unknown`. `tree` всегда КОРЕНЬ дерева, `AtRoot` здесь
// зафиксирован `true`.
export interface PassportAssembly<Part extends string = string, Registry extends string = string, Data = unknown> {
  readonly name: string;
  readonly means: string;
  readonly tree: PassportAssemblyElement<Part, Registry, Data, true>;
  readonly providerProps?: Readonly<Record<string, unknown>>;
}

export interface DataPreset {
  readonly name: string;
  readonly means: string;
  readonly data: unknown;
}
