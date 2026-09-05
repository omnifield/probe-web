import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type WorkspaceHeaderProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const WorkspaceHeader = slotAware(function WorkspaceHeader<T extends ValidComponent = "div">(props: WorkspaceHeaderProps<T>) {
  traceLife("ui.workspace-header");

  const [address, rest] = useAddress(props, anatomyParts.header.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
