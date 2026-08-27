// MAP of the tree view: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  TreeView,
  TreeViewBranch,
  TreeViewBranchContent,
  TreeViewBranchControl,
  TreeViewBranchIndentGuide,
  TreeViewBranchIndicator,
  TreeViewBranchText,
  TreeViewBranchTrigger,
  TreeViewItem,
  TreeViewItemIndicator,
  TreeViewItemText,
  TreeViewLabel,
  TreeViewNodeCheckbox,
  TreeViewNodeProvider,
  TreeViewNodeRenameInput,
  TreeViewTree,
} from "./index.jsx";

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
