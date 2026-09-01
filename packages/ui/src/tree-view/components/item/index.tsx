import { splitProps, type JSX } from "solid-js";
import {
  TreeViewBranch as ArkBranch,
  TreeViewItem as ArkItem,
  TreeViewNodeProvider as ArkNodeProvider,
  useTreeViewContext,
  type TreeNode,
} from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export interface TreeItemProps<T extends TreeNode = TreeNode> {
  readonly node?: T;
  readonly indexPath?: number[];
  readonly children?: JSX.Element;
}

export function TreeItem<T extends TreeNode = TreeNode>(
  props: TreeItemProps<T>,
) {
  traceLife("ui.tree-item");

  const [own, rest] = splitProps(props, ["node", "indexPath", "children"]);
  const api = useTreeViewContext();
  const isBranch = () => Boolean(own.node && api().collection.isBranchNode(own.node));

  return (
    <ArkNodeProvider node={own.node} indexPath={own.indexPath ?? []}>
      {isBranch() ? (
        <ArkBranch {...dropAddress(rest)} {...anatomyParts.item.attrs}>
          {own.children}
        </ArkBranch>
      ) : (
        <ArkItem {...dropAddress(rest)} {...anatomyParts.item.attrs}>
          {own.children}
        </ArkItem>
      )}
    </ArkNodeProvider>
  );
}
