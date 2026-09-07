import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type TypographyProps<T extends ValidComponent = "p"> = PolymorphicProps<T>;

export const Typography = slotAware(function Typography<T extends ValidComponent = "p">(
  props: TypographyProps<T>,
) {
  traceLife("ui.typography");

  const [address, rest] = useAddress(props, anatomyParts.root.attrs);

  return <Polymorphic as="p" {...rest} {...address} />;
});
