// Design notes: ./README.md#binding

import type { BoundPath } from "./paths.js";

// `Data`/`AtRoot` — same door as `nodes.ts`'s `PassportAssemblyElement` (`PWEB-209`): default
// `Data = unknown` keeps `path` an arbitrary `string`, exactly its old type, until a real io schema
// is plugged in. `AtRoot` defaults `true` — the sensible read of "I named a shape and didn't think
// about tree position" is "the outermost one" — but every actual node in `nodes.ts` sets it
// explicitly rather than leaning on this default.
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

// `context`'s values are the SAME "path" concept as `bind` (`PWEB-209`, point 4) — a dispatch that
// sends `{path: "titel"}` by typo was exactly as silent as a `bind` typo before this, and fixing
// one while leaving the other a bare `string` would have closed half a hole while advertising it
// as shut.
export interface DispatchAction<Data = unknown, AtRoot extends boolean = true> {
  readonly event: {
    readonly name: string;
    readonly context?: Readonly<Record<string, DynamicValue<Data, AtRoot>>>;
  };
}
