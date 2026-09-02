import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type WorkspaceSidebarProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const WorkspaceSidebar = slotAware(function WorkspaceSidebar<T extends ValidComponent = "div">(props: WorkspaceSidebarProps<T>) {
  traceLife("ui.workspace-sidebar");

  const [address, rest] = useAddress(props, anatomyParts.sidebar.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
