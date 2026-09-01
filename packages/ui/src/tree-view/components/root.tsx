import { splitProps } from "solid-js";
import {
  TreeViewRoot as ArkRoot,
  TreeViewTree as ArkTree,
  type TreeViewRootProps as ArkRootProps,
  type TreeNode,
} from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

export type TreeRootProps<T extends TreeNode = TreeNode> = ArkRootProps<T>;

export function TreeRoot<T extends TreeNode = TreeNode>(props: TreeRootProps<T>) {
  traceLife("ui.tree-view");

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      <ArkTree>{local.children}</ArkTree>
    </ArkRoot>
  );
}
