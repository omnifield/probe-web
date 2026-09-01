import { Show, splitProps, type JSX } from "solid-js";
import {
  TreeViewBranchIndicator as ArkBranchIndicator,
  TreeViewItemIndicator as ArkItemIndicator,
  useTreeViewNodeContext,
} from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../../utils/slot-chain.js";
import { traceLife } from "../../../utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type TreeControlIndicatorProps = JSX.HTMLAttributes<HTMLDivElement>;

export function TreeControlIndicator(props: TreeControlIndicatorProps) {
  traceLife("ui.tree-control-indicator");

  const [local, rest] = splitProps(props, ["children"]);
  const node = useTreeViewNodeContext();

  return (
    <Show
      when={node().isBranch}
      fallback={
        <ArkItemIndicator {...dropAddress(rest)} {...anatomyParts.controlIndicator.attrs}>
          {local.children}
        </ArkItemIndicator>
      }
    >
      <ArkBranchIndicator {...dropAddress(rest)} {...anatomyParts.controlIndicator.attrs}>
        {local.children}
      </ArkBranchIndicator>
    </Show>
  );
}
