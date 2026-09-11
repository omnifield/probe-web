import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";
import { anatomyParts } from "../entity/anatomy.js";

export type GridProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const Grid = slotAware(function Grid<T extends ValidComponent = "div">(props: GridProps<T>) {
  useKitLife(passport, props);

  const [address, rest] = useAddress(props, anatomyParts.root.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
