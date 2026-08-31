// Design notes: ./README.md#assembly

import type { PassportAssemblyElement, PassportAssemblyNode } from "./nodes.js";

// `Data` — third type parameter (`PWEB-209`): the assembly's own io schema (`z.infer` of its
// `entity/io.ts`), default `unknown` keeps `tree` accepting arbitrary `string` paths exactly as
// before. `tree` is always the tree's ROOT — `AtRoot` is pinned `true` here, the one place in the
// whole assembly-type family that ISN'T a parameter: nothing above `tree` could have narrowed
// anything yet. `refs` stays untyped (`Data` not threaded, `./nodes.ts`'s `PassportAssemblyRef`
// note) — a stored ref template is reused at whichever tree position references it, each
// potentially a different `Data`, and closing that is real work left to a follow-up.
export interface PassportAssembly<Part extends string = string, Registry extends string = string, Data = unknown> {
  readonly name: string;
  readonly means: string;
  readonly tree: PassportAssemblyElement<Part, Registry, Data, true>;
  readonly providerProps?: Readonly<Record<string, unknown>>;
  readonly refs?: Readonly<Record<string, PassportAssemblyNode<Part, Registry>>>;
}

export interface DataPreset {
  readonly name: string;
  readonly means: string;
  readonly data: unknown;
}
