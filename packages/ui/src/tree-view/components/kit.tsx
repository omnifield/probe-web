import {
  createFileTreeCollection,
  createTreeCollection,
  TreeViewBranch as ArkBranch,
  TreeViewBranchContent as ArkBranchContent,
  TreeViewBranchControl as ArkBranchControl,
  TreeViewBranchIndentGuide as ArkBranchIndentGuide,
  TreeViewBranchIndicator as ArkBranchIndicator,
  TreeViewBranchText as ArkBranchText,
  TreeViewBranchTrigger as ArkBranchTrigger,
  TreeViewItem as ArkItem,
  TreeViewItemIndicator as ArkItemIndicator,
  TreeViewItemText as ArkItemText,
  TreeViewLabel as ArkLabel,
  TreeViewNodeCheckbox as ArkNodeCheckbox,
  TreeViewNodeCheckboxIndicator as ArkNodeCheckboxIndicator,
  TreeViewNodeProvider as ArkNodeProvider,
  TreeViewNodeRenameInput as ArkNodeRenameInput,
  TreeViewRoot as ArkRoot,
  TreeViewTree as ArkTree,
  type TreeCollection,
  type TreeNode,
  type TreeViewBranchContentProps as ArkBranchContentProps,
  type TreeViewBranchControlProps as ArkBranchControlProps,
  type TreeViewBranchIndentGuideProps as ArkBranchIndentGuideProps,
  type TreeViewBranchIndicatorProps as ArkBranchIndicatorProps,
  type TreeViewBranchProps as ArkBranchProps,
  type TreeViewBranchTextProps as ArkBranchTextProps,
  type TreeViewBranchTriggerProps as ArkBranchTriggerProps,
  type TreeViewItemIndicatorProps as ArkItemIndicatorProps,
  type TreeViewItemProps as ArkItemProps,
  type TreeViewItemTextProps as ArkItemTextProps,
  type TreeViewLabelProps as ArkLabelProps,
  type TreeViewNodeCheckboxIndicatorProps as ArkNodeCheckboxIndicatorProps,
  type TreeViewNodeCheckboxProps as ArkNodeCheckboxProps,
  type TreeViewNodeProviderProps as ArkNodeProviderProps,
  type TreeViewNodeRenameInputProps as ArkNodeRenameInputProps,
  type TreeViewRootProps as ArkRootProps,
  type TreeViewTreeProps as ArkTreeProps,
} from "@ark-ui/solid/tree-view";

import { splitProps, type JSX } from "solid-js";

import { ownPart } from "../../shared/own-part.js";
import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

// Tree view — a nested list of expandable branches and leaves, from Ark
// (`ark-ui.com/docs/components/tree-view`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/tree-view`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `tree-view.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// `TreeViewNodeProvider`/`TreeViewNodeCheckboxIndicator` are wrapped too, even though NEITHER
// draws with an address of its own (`../entity/anatomy.ts` explains why): the first is REQUIRED
// for a working composition (every part inside a node needs to know which node it is), the
// second is the ergonomic way to switch a checkbox's own glyph on checked/indeterminate/
// unchecked without hand-rolling the same `<Show>` chain in every consumer.
//
// `createTreeCollection`/`createFileTreeCollection`/`TreeNode`/`TreeCollection` are re-exported
// here, not left for the consumer to reach into `@ark-ui/solid` directly for — the same device
// the select's own `createListCollection`/`CollectionItem`/`ListCollection` already uses:
// `TreeView`'s own `collection` prop needs one, and it is not JSON-shaped data a passport
// assembly can construct on its own (`PWEB-134`'s own correction about non-JSON props applies
// the same way here).

export {
  createFileTreeCollection,
  createTreeCollection,
  type TreeCollection,
  type TreeNode,
};

/** Props of `TreeView` — the root, generic over the collection's own node type. */
export type TreeViewProps<T extends TreeNode = TreeNode> = ArkRootProps<T>;

/**
 * The tree's root — holds the collection, the expanded/selected/checked value(s), and the
 * selection mode.
 *
 * @example
 * ```tsx
 * const collection = createTreeCollection({
 *   nodeToValue: (node) => node.id,
 *   nodeToString: (node) => node.name,
 *   rootNode: { id: "ROOT", name: "", children: [{ id: "src", name: "src", children: [] }] },
 * });
 *
 * <TreeView collection={collection}>
 *   <TreeViewLabel>Files</TreeViewLabel>
 *   <TreeViewTree>
 *     <For each={collection.rootNode.children}>
 *       {(node, index) => (
 *         <TreeViewNodeProvider node={node} indexPath={[index()]}>
 *           <TreeViewItem>
 *             <TreeViewItemText>{node.name}</TreeViewItemText>
 *           </TreeViewItem>
 *         </TreeViewNodeProvider>
 *       )}
 *     </For>
 *   </TreeViewTree>
 * </TreeView>
 * ```
 */
export function TreeView<T extends TreeNode = TreeNode>(
  props: TreeViewProps<T>,
) {
  traceLife("ui.tree-view");

  // Постановка user, 2026-09-01: движку схемы всё равно, приехали `root`/`tree` раздельно или
  // `tree` уже лежит внутри `root`, — он рисует то, что дал компонент, а не решает за него.
  // `children` схемы (повтор веток/листьев) едут В `ArkTree` — настоящий узел с `role="tree"` и
  // клавиатурной навигацией (`onKeyDown` коннектора, `../entity/passport.ts`), — остальные пропы
  // рута (`collection`, `selectedValue`, `expandedValue`, …) остаются на `ArkRoot` и в `ArkTree`
  // НЕ дублируются: разделены `splitProps`, не сплошным спредом.
  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      <ArkTree>{local.children}</ArkTree>
    </ArkRoot>
  );
}

/** Props of `TreeViewLabel`. */
export type TreeViewLabelProps = ArkLabelProps;

/** The tree's own label — ONE node, `<h3>`. */
export function TreeViewLabel(props: TreeViewLabelProps) {
  traceLife("ui.tree-view-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `TreeViewTree`. */
export type TreeViewTreeProps = ArkTreeProps;

/**
 * The tree's own list, standalone — `role="tree"`, real keyboard navigation. `TreeView` (above)
 * now renders one of these itself around its own `children`, so an assembly never names `tree`
 * directly; this stays exported and mapped (`kit.parts.tree`, required by `defineKitComponent`'s
 * completeness check against the real Ark anatomy) for whoever composes by hand instead of
 * through a schema — `data-output.tsx` still does, with its own explicit `TreeViewLabel` beside
 * it, a composition this file does not decide for them.
 */
export function TreeViewTree(props: TreeViewTreeProps) {
  traceLife("ui.tree-view-tree");

  return <ArkTree {...dropAddress(props)} />;
}

/** Props of `TreeViewNodeProvider`. */
export type TreeViewNodeProviderProps<T = unknown> = ArkNodeProviderProps<T>;

/**
 * Provides `node`/`indexPath` context to every part rendered inside it — REQUIRED, not optional:
 * `item`/`branch`/… all need to know which tree node they belong to (`../entity/anatomy.ts`
 * explains why this carries no address of its own). `TreeViewItem`/`TreeViewBranch` (below) each
 * wrap themselves in one of these already, reading `node`/`indexPath` off their OWN props — this
 * stays exported for whoever composes by hand instead of through a schema (`data-output.tsx`
 * still does, one per recursion level, the same shape Ark's own docs show).
 */
export function TreeViewNodeProvider<T = unknown>(props: TreeViewNodeProviderProps<T>) {
  traceLife("ui.tree-view-node-provider");

  return <ArkNodeProvider {...props} />;
}

/** Props of `TreeViewItem`. */
export type TreeViewItemProps = ArkItemProps & { node?: unknown; indexPath?: number[] };

/**
 * One LEAF node's own row — never used for a branch (`../entity/anatomy.ts`). Wraps itself in
 * `TreeViewNodeProvider`, reading `node`/`indexPath` straight off its own props (постановка user,
 * 2026-09-01: these are ordinary `bind`/`indexPathBind` values a schema can put on ANY node,
 * `packages/skin/src/passport/assembly/nodes.ts`'s `ElementFields` — not a privilege `extra`
 * needed) — a schema names `item` directly, `~nodeProvider` is not addressed anywhere anymore.
 */
export function TreeViewItem(props: TreeViewItemProps) {
  traceLife("ui.tree-view-item");

  const [own, rest] = splitProps(props, ["node", "indexPath"]);

  return (
    <ArkNodeProvider node={own.node} indexPath={own.indexPath ?? []}>
      <ArkItem {...dropAddress(rest)} />
    </ArkNodeProvider>
  );
}

/** Props of `TreeViewItemTrigger`. */
export type TreeViewItemTriggerProps = JSX.HTMLAttributes<HTMLDivElement>;

/**
 * A leaf's own header — OURS, not Ark's (`../entity/anatomy.ts`'s `extendWith`): groups
 * `itemText`/`itemIndicator`, mirroring `branchControl` for a leaf. No connector backs it (a leaf
 * has no disclosure to click), so it carries no state of its own — real focus/selection stay on
 * `item` itself. Built with `../../shared/own-part.js`, the shared template for exactly this
 * shape of part.
 */
export const TreeViewItemTrigger = ownPart("ui.tree-view-item-trigger", anatomyParts.itemTrigger.attrs);

/** Props of `TreeViewItemContent`. */
export type TreeViewItemContentProps = JSX.HTMLAttributes<HTMLDivElement>;

/**
 * A leaf's own open content slot — OURS, not Ark's (`../entity/anatomy.ts`'s `extendWith`), the
 * same shared template as `TreeViewItemTrigger` above.
 */
export const TreeViewItemContent = ownPart("ui.tree-view-item-content", anatomyParts.itemContent.attrs);

/** Props of `TreeViewItemText`. */
export type TreeViewItemTextProps = ArkItemTextProps;

/** A leaf's own label text — ONE node. */
export function TreeViewItemText(props: TreeViewItemTextProps) {
  traceLife("ui.tree-view-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}

/** Props of `TreeViewItemIndicator`. */
export type TreeViewItemIndicatorProps = ArkItemIndicatorProps;

/** A leaf's own selection mark — hidden by the kit while the leaf is not selected. */
export function TreeViewItemIndicator(props: TreeViewItemIndicatorProps) {
  traceLife("ui.tree-view-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}

/** Props of `TreeViewBranch`. */
export type TreeViewBranchProps = ArkBranchProps & { node?: unknown; indexPath?: number[] };

/**
 * One BRANCH node's own row — wraps `branchControl` and, when expanded, `branchContent`. Wraps
 * ITSELF in `TreeViewNodeProvider` the same way `TreeViewItem` does, and for the same reason —
 * `node`/`indexPath` are ordinary bound props here, not a separate schema-level `~nodeProvider`.
 */
export function TreeViewBranch(props: TreeViewBranchProps) {
  traceLife("ui.tree-view-branch");

  const [own, rest] = splitProps(props, ["node", "indexPath"]);

  return (
    <ArkNodeProvider node={own.node} indexPath={own.indexPath ?? []}>
      <ArkBranch {...dropAddress(rest)} />
    </ArkNodeProvider>
  );
}

/** Props of `TreeViewBranchControl`. */
export type TreeViewBranchControlProps = ArkBranchControlProps;

/** The branch's own clickable row — real focus lives here (roving tabindex), not on `branch` itself. */
export function TreeViewBranchControl(props: TreeViewBranchControlProps) {
  traceLife("ui.tree-view-branch-control");

  return <ArkBranchControl {...dropAddress(props)} />;
}

/** Props of `TreeViewBranchText`. */
export type TreeViewBranchTextProps = ArkBranchTextProps;

/** A branch's own label text — ONE node. */
export function TreeViewBranchText(props: TreeViewBranchTextProps) {
  traceLife("ui.tree-view-branch-text");

  return <ArkBranchText {...dropAddress(props)} />;
}

/** Props of `TreeViewBranchIndicator`. */
export type TreeViewBranchIndicatorProps = ArkBranchIndicatorProps;

/** The expand/collapse glyph — no graphic of its own; a skin typically rotates it by `data-state`. */
export function TreeViewBranchIndicator(props: TreeViewBranchIndicatorProps) {
  traceLife("ui.tree-view-branch-indicator");

  return <ArkBranchIndicator {...dropAddress(props)} />;
}

/** Props of `TreeViewBranchTrigger`. */
export type TreeViewBranchTriggerProps = ArkBranchTriggerProps;

/** Toggles the branch open/closed — `role="button"` on a `<div>`, not a real `<button>`; native `disabled` mirrors LOADING, not the node's own `disabled` (`../entity/passport.ts`). */
export function TreeViewBranchTrigger(props: TreeViewBranchTriggerProps) {
  traceLife("ui.tree-view-branch-trigger");

  return <ArkBranchTrigger {...dropAddress(props)} />;
}

/** Props of `TreeViewBranchContent`. */
export type TreeViewBranchContentProps = ArkBranchContentProps;

/** Wraps a branch's own children — hidden by the kit while the branch is not expanded. */
export function TreeViewBranchContent(props: TreeViewBranchContentProps) {
  traceLife("ui.tree-view-branch-content");

  return <ArkBranchContent {...dropAddress(props)} />;
}

/** Props of `TreeViewBranchIndentGuide`. */
export type TreeViewBranchIndentGuideProps = ArkBranchIndentGuideProps;

/** A vertical guide line at one nesting depth — no graphic of its own, purely structural. */
export function TreeViewBranchIndentGuide(
  props: TreeViewBranchIndentGuideProps,
) {
  traceLife("ui.tree-view-branch-indent-guide");

  return <ArkBranchIndentGuide {...dropAddress(props)} />;
}

/** Props of `TreeViewNodeCheckbox`. */
export type TreeViewNodeCheckboxProps = ArkNodeCheckboxProps;

/** A node's own checkbox — works on a leaf or a branch alike; `role="checkbox"`, never itself keyboard-focusable. */
export function TreeViewNodeCheckbox(props: TreeViewNodeCheckboxProps) {
  traceLife("ui.tree-view-node-checkbox");

  return <ArkNodeCheckbox {...dropAddress(props)} />;
}

/** Props of `TreeViewNodeCheckboxIndicator` — a pure conditional helper, no address, no DOM node of its own. */
export type TreeViewNodeCheckboxIndicatorProps = ArkNodeCheckboxIndicatorProps;

/** Picks `children`/`indeterminate`/`fallback` to show, based on the node's own checked state. */
export function TreeViewNodeCheckboxIndicator(
  props: TreeViewNodeCheckboxIndicatorProps,
) {
  traceLife("ui.tree-view-node-checkbox-indicator");

  return <ArkNodeCheckboxIndicator {...props} />;
}

/** Props of `TreeViewNodeRenameInput`. */
export type TreeViewNodeRenameInputProps = ArkNodeRenameInputProps;

/** A real, hidden-until-renaming `<input type="text">` — shown only while this node is being renamed. */
export function TreeViewNodeRenameInput(props: TreeViewNodeRenameInputProps) {
  traceLife("ui.tree-view-node-rename-input");

  return <ArkNodeRenameInput {...dropAddress(props)} />;
}

// MAP of the tree view: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/**
 * The tree view's passport together with whatever draws each of its seventeen parts.
 *
 * NO `extras` (постановка user, 2026-09-01 — README «`extras` — проверка по всему киту: кейса не
 * нашлось ни одного»): `TreeViewItem`/`TreeViewBranch` already wrap themselves in
 * `TreeViewNodeProvider`, reading `node`/`indexPath` off their own props — a schema never
 * addresses `~nodeProvider` separately, so the kit's own map has nothing to register it under.
 * `TreeViewNodeCheckboxIndicator` is NOT here either: a pure content-composition helper (no DOM
 * node, `../entity/anatomy.ts` explains why), not required for a preview to work.
 */
export const kit = defineKitComponent(passport, {
  root: TreeView,
  label: TreeViewLabel,
  tree: TreeViewTree,
  item: TreeViewItem,
  itemTrigger: TreeViewItemTrigger,
  itemText: TreeViewItemText,
  itemIndicator: TreeViewItemIndicator,
  itemContent: TreeViewItemContent,
  branch: TreeViewBranch,
  branchControl: TreeViewBranchControl,
  branchText: TreeViewBranchText,
  branchIndicator: TreeViewBranchIndicator,
  branchTrigger: TreeViewBranchTrigger,
  branchContent: TreeViewBranchContent,
  branchIndentGuide: TreeViewBranchIndentGuide,
  nodeCheckbox: TreeViewNodeCheckbox,
  nodeRenameInput: TreeViewNodeRenameInput,
});
