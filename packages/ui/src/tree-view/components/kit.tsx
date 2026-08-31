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

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

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

export { createFileTreeCollection, createTreeCollection, type TreeCollection, type TreeNode };

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
export function TreeView<T extends TreeNode = TreeNode>(props: TreeViewProps<T>) {
  traceLife("ui.tree-view");

  return <ArkRoot {...dropAddress(props)} />;
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

/** The tree's own root list — ONE node, `role="tree"`; holds the top-level items/branches. */
export function TreeViewTree(props: TreeViewTreeProps) {
  traceLife("ui.tree-view-tree");

  return <ArkTree {...dropAddress(props)} />;
}

/** Props of `TreeViewNodeProvider`. */
export type TreeViewNodeProviderProps<T = unknown> = ArkNodeProviderProps<T>;

/**
 * Provides `node`/`indexPath` context to every part rendered inside it — REQUIRED, not optional:
 * `item`/`branch`/… all need to know which tree node they belong to (`../entity/anatomy.ts`
 * explains why this carries no address of its own).
 */
export function TreeViewNodeProvider<T = unknown>(props: TreeViewNodeProviderProps<T>) {
  traceLife("ui.tree-view-node-provider");

  return <ArkNodeProvider {...props} />;
}

/** Props of `TreeViewItem`. */
export type TreeViewItemProps = ArkItemProps;

/** One LEAF node's own row — never used for a branch (`../entity/anatomy.ts`). */
export function TreeViewItem(props: TreeViewItemProps) {
  traceLife("ui.tree-view-item");

  return <ArkItem {...dropAddress(props)} />;
}

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
export type TreeViewBranchProps = ArkBranchProps;

/** One BRANCH node's own row — wraps `branchControl` and, when expanded, `branchContent`. */
export function TreeViewBranch(props: TreeViewBranchProps) {
  traceLife("ui.tree-view-branch");

  return <ArkBranch {...dropAddress(props)} />;
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
export function TreeViewBranchIndentGuide(props: TreeViewBranchIndentGuideProps) {
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
export function TreeViewNodeCheckboxIndicator(props: TreeViewNodeCheckboxIndicatorProps) {
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
 * The tree view's passport together with whatever draws each of its fifteen parts.
 *
 * `nodeProvider` lives in `extras` (`PWEB-152`): a real component without an anatomy address —
 * every part inside a node needs its `node`/`indexPath` context to know which tree node it
 * belongs to, so a preview built without it would not just look wrong, it would not render at
 * all. `TreeViewNodeCheckboxIndicator` is NOT here: it is a pure content-composition helper (no
 * DOM node, `../entity/anatomy.ts` explains why), not required for a preview to work.
 */
export const kit = defineKitComponent(
  passport,
  {
    root: TreeView,
    label: TreeViewLabel,
    tree: TreeViewTree,
    item: TreeViewItem,
    itemText: TreeViewItemText,
    itemIndicator: TreeViewItemIndicator,
    branch: TreeViewBranch,
    branchControl: TreeViewBranchControl,
    branchText: TreeViewBranchText,
    branchIndicator: TreeViewBranchIndicator,
    branchTrigger: TreeViewBranchTrigger,
    branchContent: TreeViewBranchContent,
    branchIndentGuide: TreeViewBranchIndentGuide,
    nodeCheckbox: TreeViewNodeCheckbox,
    nodeRenameInput: TreeViewNodeRenameInput,
  },
  { nodeProvider: TreeViewNodeProvider },
);
