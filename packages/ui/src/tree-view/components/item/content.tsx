import { Show, splitProps, type JSX } from "solid-js";
import {
  TreeViewBranchContent as ArkBranchContent,
  useTreeViewNodeContext,
} from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type TreeContentProps = JSX.HTMLAttributes<HTMLDivElement>;

export function TreeContent(props: TreeContentProps) {
  traceLife("ui.tree-content");

  const [local, rest] = splitProps(props, ["children"]);
  const node = useTreeViewNodeContext();

  return (
    <Show
      when={node().isBranch}
      fallback={
        <div {...dropAddress(rest)} {...anatomyParts.content.attrs}>
          {local.children}
        </div>
      }
    >
      <ArkBranchContent
        {...dropAddress(rest)}
        {...anatomyParts.content.attrs}
      >
        {local.children}
      </ArkBranchContent>
    </Show>
  );
}
