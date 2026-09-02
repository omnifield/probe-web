import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type WorkspaceMainProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const WorkspaceMain = slotAware(function WorkspaceMain<T extends ValidComponent = "div">(props: WorkspaceMainProps<T>) {
  traceLife("ui.workspace-main");

  const [address, rest] = useAddress(props, anatomyParts.main.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
