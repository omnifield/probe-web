import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type WorkspaceFooterProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const WorkspaceFooter = slotAware(function WorkspaceFooter<T extends ValidComponent = "div">(props: WorkspaceFooterProps<T>) {
  traceLife("ui.workspace-footer");

  const [address, rest] = useAddress(props, anatomyParts.footer.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
