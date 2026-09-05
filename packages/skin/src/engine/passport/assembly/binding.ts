
import type { BoundPath } from "./paths.js";

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

export function resolveDataBinding(data: unknown, path: string): unknown {
  if (path === "") return data;
  if (!path.startsWith("/")) return undefined;

  let current: unknown = data;
  for (const raw of path.slice(1).split("/")) {
    const segment = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (current === null || current === undefined) return undefined;

    if (Array.isArray(current)) {
      const index = Number(segment);
      current = Number.isInteger(index) ? current[index] : undefined;
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

// `context` несёт то же понятие пути, что `bind` — типизировано тем же приёмом.
export interface DispatchAction<Data = unknown, AtRoot extends boolean = true> {
  readonly event: {
    readonly name: string;
    readonly context?: Readonly<Record<string, DynamicValue<Data, AtRoot>>>;
  };
}
