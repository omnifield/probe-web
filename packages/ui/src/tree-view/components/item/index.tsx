import { splitProps, type JSX } from "solid-js";
import {
  TreeViewBranch as ArkBranch,
  TreeViewItem as ArkItem,
  TreeViewNodeContext as ArkNodeContext,
  TreeViewNodeProvider as ArkNodeProvider,
  type TreeNode,
} from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";
import { activeOverride, useTreeActiveValue } from "../root.js";

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
  const activeValue = useTreeActiveValue();

  return (
    <ArkNodeProvider node={own.node} indexPath={own.indexPath ?? []}>
      <ArkNodeContext>
        {(nodeState) =>
          nodeState().isBranch ? (
            <ArkBranch
              {...dropAddress(rest)}
              {...anatomyParts.item.attrs}
              {...activeOverride(activeValue(), nodeState().value)}
            >
              {own.children}
            </ArkBranch>
          ) : (
            <ArkItem
              {...dropAddress(rest)}
              {...anatomyParts.item.attrs}
              {...activeOverride(activeValue(), nodeState().value)}
            >
              {own.children}
            </ArkItem>
          )
        }
      </ArkNodeContext>
    </ArkNodeProvider>
  );
}
