import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";
import { anatomyParts } from "../entity/anatomy.js";

export type FlowProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const Flow = slotAware(function Flow<T extends ValidComponent = "div">(props: FlowProps<T>) {
  useKitLife(passport, props);

  const [address, rest] = useAddress(props, anatomyParts.root.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
