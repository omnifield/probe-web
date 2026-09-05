import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type FlowItemProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const FlowItem = slotAware(function FlowItem<T extends ValidComponent = "div">(props: FlowItemProps<T>) {
  traceLife("ui.flow-item");

  const [address, rest] = useAddress(props, anatomyParts.item.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
