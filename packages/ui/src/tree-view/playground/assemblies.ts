// STRUCTURAL assembly templates for the tree view — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/assemblies.ts` (`PWEB-127`).
//
// LEFT EMPTY, but NOT because the engine is missing anything — a PRIOR version of this comment
// claimed exactly that (per-node `TreeViewNodeProvider` context needs plumbing nobody had built),
// and it was wrong: checked live (`../test/node-provider.test.tsx`), a real three-level
// branch→item tree renders correctly through the mechanism that already exists.
//
// What actually resolves each node's context: `defineKitComponent`'s THIRD argument
// (`../components/kit.tsx`) already registers `nodeProvider` as an `extra` — `tree-view.~nodeProvider`
// resolves through the registry (`packages/assembly/src/registry.ts`) exactly like any named part,
// and `RenderNode` recurses into an extra's own children the same uniform way it recurses into
// anything else. `AssemblyElement.props` is `Record<string, unknown>` (`packages/assembly/src/
// tree.ts`), not JSON-restricted — a hand-built tree's `props` can carry a real `TreeCollection`
// instance, a real node object, a real `indexPath` array, which is all `TreeViewNodeProvider`
// itself actually needs (`createSplitProps()(props, ["indexPath", "node"])` — plain props, no
// magic). The earlier comment checked `render.tsx`'s ROOT-level `provider` mechanism (PWEB-153,
// one provider for the WHOLE tree) and concluded per-node wrapping needed the same kind of engine
// change — without checking whether `extras`, sitting right there in this same component's own
// `kit.tsx`, already solved it a different way.
//
// WHY THIS FILE STAYS EMPTY ANYWAY: it holds `PassportAssembly[]`, the DECLARATIVE repeat/bind
// authoring format every other component's assemblies use — and that format genuinely cannot
// express this. `repeat` expands one array, once; it has no way to compute an INCREMENTING
// `indexPath` across nested levels the way a real recursive walk needs. A working tree-view
// assembly needs a programmatic function that walks real source data and emits the flat
// `AssemblyTree` directly (`buildTree`, `../test/node-provider.test.tsx`) — a real, but different,
// piece of code from what this file's own shape is for. Not started here; not blocked either.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type TreeViewPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<TreeViewPart>[] = [];
