import { Show, splitProps, type JSX } from "solid-js";
import {
  TreeViewBranchControl as ArkBranchControl,
  useTreeViewNodeContext,
} from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type TreeControlProps = JSX.HTMLAttributes<HTMLDivElement>;

export function TreeControl(props: TreeControlProps) {
  traceLife("ui.tree-control");

  const [local, rest] = splitProps(props, ["children"]);
  const node = useTreeViewNodeContext();

  return (
    <Show
      when={node().isBranch}
      fallback={
        <div {...dropAddress(rest)} {...anatomyParts.control.attrs}>
          {local.children}
        </div>
      }
    >
      <ArkBranchControl
        {...dropAddress(rest)}
        {...anatomyParts.control.attrs}
      >
        {local.children}
      </ArkBranchControl>
    </Show>
  );
}
