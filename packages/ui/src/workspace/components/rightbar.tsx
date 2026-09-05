import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type WorkspaceRightbarProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const WorkspaceRightbar = slotAware(function WorkspaceRightbar<T extends ValidComponent = "div">(props: WorkspaceRightbarProps<T>) {
  traceLife("ui.workspace-rightbar");

  const [address, rest] = useAddress(props, anatomyParts.rightbar.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
