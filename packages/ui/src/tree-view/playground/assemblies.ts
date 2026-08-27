// STRUCTURAL assembly templates for the tree view — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/assemblies.ts` (`PWEB-127`).
//
// LEFT EMPTY ON PURPOSE, and not a placeholder waiting to be filled the usual way: a real entry
// crashes at render, checked live (`useTreeViewNodePropsContext returned undefined`, thrown by
// Ark's `TreeViewBranch`/`TreeViewItem`/… — every node-scoped part reads this context, twelve of
// the fifteen parts, confirmed by reading `@ark-ui/solid`'s own compiled source directly).
//
// WHY THIS IS DEEPER than the missing-`TreeViewNodeProvider` wrapper the earlier draft of this
// file named: the context a node-scoped part reads is not a plain value — `TreeViewBranch` calls
// `treeView().getBranchProps(nodeProps)`, which asks the Zag MACHINE to look `nodeProps.indexPath`
// up in the collection actually passed to `TreeView.Root`'s own `collection` prop. An assembly
// tree has no such collection at all (`PassportAssemblyPart` addresses PARTS and CONTENT, the
// same "root's real machinery" gap the table's own assemblies file names for its own root) — so
// there is no node for `indexPath` to resolve to, synthetic or otherwise, without ALSO
// synthesizing a matching `createTreeCollection(...)` at the root and wiring every node-scoped
// part underneath it to a `TreeViewNodeProvider` carrying the matching `node`/`indexPath`.
//
// That is real plumbing, not prose — it belongs to whoever owns the render path (`../components/
// index.tsx`'s own kit wrappers, or a generic per-node provider in `packages/assembly`'s own
// `render.tsx`, which today only wraps a tree ONCE at the root — `PWEB-153`, for parts like the
// popover's/menu's own `positioner` that need a single shared context, not one context PER NODE).
// Filling this file with a working `root`/`label`/`tree`/`item`/`branch` tree is blocked on that
// plumbing landing first, not on picking a better shape of tree to describe.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type TreeViewPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<TreeViewPart>[] = [];
