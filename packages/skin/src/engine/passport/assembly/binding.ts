import type { BoundPath } from "./paths.js";

export { resolveDataBinding } from "@web-core/assembly";

// `Data`/`AtRoot` — та же дверь, что у `PassportAssemblyElement` (nodes.ts): по умолчанию `path`
// остаётся произвольной строкой, пока не подставлена io-схема.
export interface DataBinding<Data = unknown, AtRoot extends boolean = true> {
  readonly path: BoundPath<Data, AtRoot>;
}

export type DynamicValue<Data = unknown, AtRoot extends boolean = true> = string | DataBinding<Data, AtRoot>;

export function isDataBinding<Data = unknown, AtRoot extends boolean = true>(
  value: DynamicValue<Data, AtRoot>,
): value is DataBinding<Data, AtRoot> {
  return typeof value === "object" && value !== null && "path" in value;
}

// `context` несёт то же понятие пути, что `bind` — типизировано тем же приёмом.
export interface DispatchAction<Data = unknown, AtRoot extends boolean = true> {
  readonly event: {
    readonly name: string;
    readonly context?: Readonly<Record<string, DynamicValue<Data, AtRoot>>>;
  };
}
