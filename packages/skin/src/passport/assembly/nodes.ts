// Design notes: ./README.md#nodes

import type { PassportGenus } from "./admission.js";
import type { DispatchAction, DynamicValue } from "./binding.js";
import type { ArrayPaths, Bare, BoundPath, ElementAt, NextRoot, RepeatPath } from "./paths.js";

// `Registry` — second type parameter, same shape of purpose as `Part` (`PWEB-208`): `node` names
// EITHER this component's own anatomy part OR another component of the shared registry (`PWEB-172`
// merged the two into one field), and only the first half was ever checkable — `Part | string`
// gave up on the second half for want of a closed list to check it against. Defaults to `string`
// so every existing call (none names it explicitly — inferred, same as `Part`) keeps compiling; a
// real closed list arrives from `packages/ui`'s generated barrel (`PWEB-208`), one component at a
// time, by writing `PassportAssemblyElement<OwnPart, KitComponentName>` instead of leaving it out.
//
// `Data`/`AtRoot` — third and fourth (`PWEB-209`): `bind`/`repeat.path`/content `value` were a bare
// `string` no matter what, an opaque JSON Pointer no compiler ever read. `Data` is the io schema
// active at THIS node (`z.infer` of a component's `entity/io.ts`, default `unknown` — every
// existing declaration keeps accepting an arbitrary string, same backward-compatibility shape as
// `Part`/`Registry`'s defaults). `AtRoot` tracks the one thing `Data` alone can't: whether a
// `repeat` has EVER narrowed this branch of the tree yet — it decides the STRING FORMAT
// (`./paths.ts`'s `BoundPath`), because the runtime agrees: `expand.ts`'s `scopedPath` treats a
// leading `/` as absolute-from-`io.input` and anything else as relative-to-the-current-scope, and
// `binding.ts`'s `resolveDataBinding` only ever resolves the absolute form that scoping produces.
// Defaults to `true` (the outermost read of "I named a shape and didn't say where") but every node
// below an actual `repeat` sets it to `false` explicitly, via `RepeatedElement`'s own substitution.
interface ElementFields<Part extends string, Registry extends string, Data, AtRoot extends boolean> {
  readonly node: Part | Registry;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, BoundPath<Data, AtRoot>>>;
  readonly on?: Readonly<Record<string, DispatchAction<Data, AtRoot>>>;
}

// One variant PER legal `repeat.path` literal (`K`) — not `repeat: {path: RepeatPath<...>}` as a
// plain field next to everything else: `bind`/`children` on THIS SAME node already read the
// POST-repeat element (accordion's own `{node: "item", repeat: {path: "/sections"}, bind: {value:
// "id"}, ...}` — `"id"` is `Section.id`, not a field of the outer `io.input`), so the node's OWN
// `Data` parameter must already have shifted by the time `bind`/`children` are typed, and a plain
// optional field can't make that depend on WHICH path ended up chosen. Indexing a mapped type by
// its own key union (`{...}[RepeatPath<...>]`) is what makes the shift depend on the literal `K` a
// human actually wrote (proven against accordion's real two-level `sections`/`items` nesting,
// `test/nodes.test.ts`, before this replaced the old flat `repeat?: DataBinding` field).
type RepeatedElement<Part extends string, Registry extends string, Data, AtRoot extends boolean> = {
  [K in RepeatPath<Data, AtRoot>]: ElementFields<Part, Registry, ElementAt<Data, Bare<K> & (ArrayPaths<Data> | "")>, NextRoot<Data>> & {
    readonly repeat: { readonly path: K };
    readonly children?: readonly PassportAssemblyNode<Part, Registry, ElementAt<Data, Bare<K> & (ArrayPaths<Data> | "")>, NextRoot<Data>>[];
  };
}[RepeatPath<Data, AtRoot>];

type PlainElement<Part extends string, Registry extends string, Data, AtRoot extends boolean> = ElementFields<
  Part,
  Registry,
  Data,
  AtRoot
> & {
  readonly repeat?: undefined;
  readonly children?: readonly PassportAssemblyNode<Part, Registry, Data, AtRoot>[];
};

export type PassportAssemblyElement<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
> = PlainElement<Part, Registry, Data, AtRoot> | RepeatedElement<Part, Registry, Data, AtRoot>;

export interface PassportAssemblyContent<Data = unknown, AtRoot extends boolean = true> {
  readonly genus: PassportGenus;
  readonly value: DynamicValue<Data, AtRoot>;
}

// `extra` stays a bare `string`, not `Part | Registry`: an extra's name is PRIVATE to this
// component's own assembly (`PWEB-165` — "extra приватен не глобален"), not a member of either
// closed list `Registry` stands for. No `repeat` variant either — an extra never carries one
// (`admission.ts`'s own README notes extras are addressed by `name`, not shaped like a part).
export interface PassportAssemblyExtra<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
> {
  readonly extra: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, BoundPath<Data, AtRoot>>>;
  readonly on?: Readonly<Record<string, DispatchAction<Data, AtRoot>>>;
  readonly children?: readonly PassportAssemblyNode<Part, Registry, Data, AtRoot>[];
}

// The tree's own entry always starts `AtRoot` — nothing has narrowed anything yet.
export interface PassportSelfAssembly<Part extends string = string, Registry extends string = string, Data = unknown> {
  readonly tree: PassportAssemblyElement<Part, Registry, Data, true>;
}

// The older `{repeat, template}` wrapper (kept working, unchanged, next to the field form —
// `test/repeat-field.test.ts`'s own second proof) needs the exact same per-`K` treatment as
// `RepeatedElement` above, for the exact same reason: `template`'s `Data` depends on which path was
// actually chosen.
export type PassportAssemblyRepeat<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
> = {
  [K in RepeatPath<Data, AtRoot>]: {
    readonly repeat: { readonly path: K };
    readonly template: PassportAssemblyNode<Part, Registry, ElementAt<Data, Bare<K> & (ArrayPaths<Data> | "")>, NextRoot<Data>>;
  };
}[RepeatPath<Data, AtRoot>];

export function isAssemblyRepeat<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
>(node: PassportAssemblyNode<Part, Registry, Data, AtRoot>): node is PassportAssemblyRepeat<Part, Registry, Data, AtRoot> {
  return "template" in node;
}

// `ref` stays a bare `string` too: it names a subtree WITHIN this same assembly's own `refs` map
// (`PWEB-160`), not a registry name either. `bind` here stays the untyped default (`Data`/`AtRoot`
// left out, not threaded): a ref's template is stored ONCE in `refs` and reused wherever it's
// referenced, each use potentially at a DIFFERENT tree position with a DIFFERENT `Data` — closing
// this properly needs the reference's OWN use-site `Data` threaded through `mergeRef`
// (`expand.ts`), which is real work left to a follow-up, not a silent gap introduced here (the
// bare `string` this had before `PWEB-209` is exactly the bare `string` it still has).
export interface PassportAssemblyRef {
  readonly ref: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Record<string, DispatchAction>>;
}

export function isAssemblyRef<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
>(node: PassportAssemblyNode<Part, Registry, Data, AtRoot>): node is PassportAssemblyRef {
  return "ref" in node;
}

export type PassportAssemblyNode<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
> =
  | PassportAssemblyElement<Part, Registry, Data, AtRoot>
  | PassportAssemblyContent<Data, AtRoot>
  | PassportAssemblyExtra<Part, Registry, Data, AtRoot>
  | PassportAssemblyRepeat<Part, Registry, Data, AtRoot>
  | PassportAssemblyRef;

export function isAssemblyContent(node: PassportAssemblyNode): node is PassportAssemblyContent {
  return "genus" in node;
}

export function isAssemblyExtra(node: PassportAssemblyNode): node is PassportAssemblyExtra {
  return "extra" in node;
}
