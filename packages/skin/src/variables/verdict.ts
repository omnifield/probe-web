// Design notes: ./README.md#verdict

import { property, type VariableHome } from "./home.js";

export type ReferenceVerdict =
  | { readonly kind: "known" }
  | { readonly kind: "elsewhere"; readonly homes: readonly VariableHome[] }
  | { readonly kind: "unknown" };

export function referenceVerdict(
  name: string,
  known: ReadonlySet<string>,
  homes: ReadonlyMap<string, readonly VariableHome[]>,
): ReferenceVerdict {
  const propertyName = property(name);

  if (known.has(propertyName)) return { kind: "known" };

  const home = homes.get(propertyName);

  return home ? { kind: "elsewhere", homes: home } : { kind: "unknown" };
}
