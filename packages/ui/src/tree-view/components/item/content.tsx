import { Show, splitProps, type JSX } from "solid-js";
import {
  TreeViewBranchContent as ArkBranchContent,
  useTreeViewNodeContext,
} from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../../utils/slot-chain.js";
import { traceLife } from "../../../utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type TreeItemContentProps = JSX.HTMLAttributes<HTMLDivElement>;

export function TreeItemContent(props: TreeItemContentProps) {
  traceLife("ui.tree-item-content");

  const [local, rest] = splitProps(props, ["children"]);
  const node = useTreeViewNodeContext();

  return (
    <Show
      when={node().isBranch}
      fallback={
        <div {...dropAddress(rest)} {...anatomyParts.itemContent.attrs}>
          {local.children}
        </div>
      }
    >
      <ArkBranchContent {...dropAddress(rest)} {...anatomyParts.itemContent.attrs}>
        {local.children}
      </ArkBranchContent>
    </Show>
  );
}
