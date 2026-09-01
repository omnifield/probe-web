import { Show, splitProps, type JSX } from "solid-js";
import { TreeViewBranchControl as ArkBranchControl, useTreeViewNodeContext } from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../../utils/slot-chain.js";
import { traceLife } from "../../../utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type TreeItemControlProps = JSX.HTMLAttributes<HTMLDivElement>;

export function TreeItemControl(props: TreeItemControlProps) {
  traceLife("ui.tree-item-control");

  const [local, rest] = splitProps(props, ["children"]);
  const node = useTreeViewNodeContext();

  return (
    <Show
      when={node().isBranch}
      fallback={
        <div {...dropAddress(rest)} {...anatomyParts.itemControl.attrs}>
          {local.children}
        </div>
      }
    >
      <ArkBranchControl {...dropAddress(rest)} {...anatomyParts.itemControl.attrs}>
        {local.children}
      </ArkBranchControl>
    </Show>
  );
}
