// Design notes: ./README.md#paths

/**
 * A leaf value — nothing meaningful to descend into. `Date`/`RegExp` count as leaves even though
 * they structurally have properties: they are read as ONE value, never addressed field-by-field.
 */
type Leaf = string | number | boolean | bigint | symbol | null | undefined | Date | RegExp;

/**
 * `T`, minus optionality/nullability, minus one layer of array — the shape actually reachable by
 * NAME from here. Applied at every step of `Paths`/`ValueAt`'s own recursion, not once at the top:
 * an array nested two levels down gets exactly the same treatment the top-level one does, which is
 * the whole mechanism behind "falls through arrays without an index" (`PWEB-209`).
 */
type Elem<T> = NonNullable<T> extends readonly (infer Item)[] ? Item : NonNullable<T>;

type Prev6 = [never, 0, 1, 2, 3, 4, 5];

/**
 * Every field-name path reachable from `T` — `/`-joined, NEVER a numeric segment. A field typed as
 * an array is offered BOTH as a leaf (the array itself — a `repeat` target, see `ArrayPaths`) and,
 * transparently, one level further in — `Elem<T>[K]`'s own paths — because the index that would
 * make a literal path through it is supplied by `repeat` at RENDER time, not authored here
 * (`PWEB-209`, point 1). Whether a given path is reachable from any ONE specific node of an actual
 * assembly tree is a narrower question this type does not answer by itself — `PassportAssemblyNode`
 * threading a node's own `Data` parameter (point 2) is what narrows it, one `repeat` at a time.
 *
 * `Depth` bounds the recursion (defaults to 6 — generous for real form nesting, accordion's own
 * needs 2) so a self-referential or unusually deep schema fails closed (`never`) instead of
 * `tsc`'s "type instantiation is excessively deep" — a bound was worth having BEFORE the first real
 * multi-level schema exercised this, not after (per PWEB-209's own warning about deep recursive
 * template literal types).
 */
// `unknown extends T` is true ONLY when `T` is exactly `unknown` — the default every assembly
// type uses for `Data` (`PWEB-209`) when a caller hasn't plugged in a real io schema yet, same
// spirit as `Part`/`Registry`'s `= string` default (`PWEB-206`/`PWEB-208`): every existing
// declaration in the kit, none of which names `Data`, keeps accepting an arbitrary `string` — the
// exact behavior it had before this type existed.
export type Paths<T, Depth extends number = 6> = unknown extends T
  ? string
  : [Depth] extends [0]
    ? never
    : {
        [K in keyof Elem<T> & string]: Elem<T>[K] extends Leaf ? K : K | `${K}/${Paths<Elem<T>[K], Prev6[Depth]>}`;
      }[keyof Elem<T> & string];

/**
 * The type sitting at path `K` within `T` — the array itself for a path that STOPS at one (e.g.
 * `"items"`), the element's own field type for a path that continued past it (`"items/title"`).
 * Backs `ArrayPaths`'s filter and `ElementAt`'s narrowing; not exported on its own because nothing
 * outside this file has a use for "the raw type at a path" that isn't already one of those two.
 */
type ValueAt<T, K extends string, Depth extends number = 6> = unknown extends T
  ? unknown
  : [Depth] extends [0]
    ? never
    : K extends `${infer Head}/${infer Rest}`
      ? Head extends keyof Elem<T>
        ? ValueAt<Elem<T>[Head], Rest, Prev6[Depth]>
        : never
      : K extends keyof Elem<T>
        ? Elem<T>[K]
        : never;

/**
 * `Paths<T>`, narrowed to the paths that lead to an ARRAY — the only paths `repeat.path` may
 * legally hold (`PWEB-209`, point 3). A path into a plain string/number field type-checking as a
 * repeat target was possible before this and wrong every time; closing it is the entire point of a
 * separate, narrower type instead of reusing `Paths<T>` as-is for `repeat`.
 */
// `NonNullable<ValueAt<...>>`, not `ValueAt<...>` bare: an OPTIONAL array field's raw type is
// `readonly X[] | undefined`, and `(readonly X[] | undefined) extends readonly unknown[]` is
// FALSE — a union only extends a type when EVERY member does, and `undefined` never does. Found by
// running this against accordion's own `items?: readonly Item[]` (`test/paths.test.ts`) before
// this ever reached the assembly tree types — an optional array field silently failing to register
// as a `repeat` target would have been a much harder bug to trace once buried under `PWEB-209`'s
// Data-threading (point 2).
export type ArrayPaths<T, Depth extends number = 6> = unknown extends T
  ? string
  : {
      [K in Paths<T, Depth>]: NonNullable<ValueAt<T, K, Depth>> extends readonly unknown[] ? K : never;
    }[Paths<T, Depth>];

/**
 * The Data a `repeat`'s OWN template/children see — the ELEMENT type of the array `repeat.path`
 * names, not the array itself and not the node's own incoming `Data` (`PWEB-209`, point 2). This is
 * the one place "falls through an array" changes what `T` even MEANS for a subtree, as opposed to
 * `Paths`/`ArrayPaths` merely naming a path within a `T` that stays fixed.
 */
// `K extends ArrayPaths<T> | ""` — not `ArrayPaths<T>` alone: `""` is `BoundPath`/`RepeatPath`'s
// self-reference sentinel (below), and `ArrayPaths`/`ValueAt` have no field named `""` to resolve
// it through — `Elem<T>` (self, array-unwrapped) IS the answer for that one case, handled directly
// rather than routed through `ValueAt`, which was never meant to understand a marker that isn't a
// path segment at all.
export type ElementAt<T, K extends ArrayPaths<T> | ""> = unknown extends T ? unknown : K extends "" ? Elem<T> : Elem<ValueAt<T, K>>;

/**
 * Strip a leading `/`, if any — a chosen `repeat.path` arrives here in whichever format
 * `RepeatPath` demanded (`"/sections"` at the root, `"items"` once already scoped), but `ArrayPaths`/
 * `ElementAt` only ever speak the bare, unprefixed form. One place to undo the prefix instead of
 * every caller re-deriving it.
 */
export type Bare<K extends string> = K extends `/${infer Rest}` ? Rest : K;

/**
 * A bind/content path in the format this ONE tree position actually authors it in — absolute
 * (`"/sections"`, from `io.input`'s root) at the very top of an assembly, before any `repeat` has
 * narrowed anything; relative (`"title"`, from whatever `Data` the nearest ancestor `repeat`
 * produced) everywhere below that (`PWEB-209`, point 2). This mirrors the RUNTIME rule exactly —
 * `expand.ts`'s `scopedPath` prefixes a relative path with the current scope and leaves an absolute
 * one (leading `/`) alone, and `binding.ts`'s `resolveDataBinding` only ever resolves the absolute
 * form it receives after that prefixing. `AtRoot` is that same fork, one level earlier, in the type.
 */
// `"" |`, unconditionally, ahead of the root/scoped fork — found live (ui-architect's pilot on
// accordion's REAL, shipping `playground/assemblies/base.ts`, not a synthetic case): `"" `is a
// documented, INTENTIONAL third path shape — "the whole current node/Data", the same marker
// `binding.ts`'s `resolveDataBinding` special-cases first (`path === "" ? data : ...`), same as
// `button`'s own `selfAssembly` (`payload: ""`) and accordion's own action-list (`context:
// {payload: {path: ""}}`) already rely on. It is not a field name — `Paths<T>` has and should have
// no member for it — so it is added here, once, rather than forced awkwardly into `Paths` itself.
// Legal at EVERY `AtRoot`: "the current node" needs no format fork, unlike a real field path.
export type BoundPath<T, AtRoot extends boolean> = unknown extends T ? string : "" | (AtRoot extends true ? `/${Paths<T>}` : Paths<T>);

// `""` here too, but ONLY when `T` ITSELF is already array-shaped (repeating over "the current
// node" only makes sense if that node IS an array) — and, unlike the format fork above, NEVER run
// through the `/` prefix: `scopedPath` checks `path === ""` before it ever asks whether a path is
// absolute, so `""` reads as itself at every `AtRoot`, never as `"/"`.
/** `BoundPath`, narrowed to array-leading paths — the format `repeat.path` itself authors in. */
export type RepeatPath<T, AtRoot extends boolean> = unknown extends T
  ? string
  : (NonNullable<T> extends readonly unknown[] ? "" : never) | (AtRoot extends true ? `/${ArrayPaths<T>}` : ArrayPaths<T>);

/**
 * The `AtRoot` a `repeat`'s children/template inherit — `false` (narrowed) once `T` is a REAL
 * schema, but `true` (unchanged) when `T` is still the untyped default `unknown`. Without this,
 * every recursive step of an untyped tree would alternate between `AtRoot = true` and `false` for
 * no reason (`Data` never actually narrows when it's `unknown` — there is nothing TO narrow), and a
 * generic function typed against the bare, all-defaults `PassportAssemblyNode` (`AtRoot = true`) —
 * `../editor/check-assembly.ts`, `./expand.ts` — would stop accepting its OWN children two levels
 * down, purely from a `true`-vs-`false` literal mismatch TypeScript treats as significant even
 * though both resolve to the identical permissive `string` shape. Found by running the real
 * traversal code against a Data-typed tree, not by inspection (`test/nodes.test.ts`).
 */
export type NextRoot<T> = unknown extends T ? true : false;
