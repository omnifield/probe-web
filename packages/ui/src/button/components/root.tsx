import {
  Root as KobalteButton,
  type ButtonRootProps,
} from "@kobalte/core/button";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import {
  useAddress,
  useSlot,
  slotAware,
} from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";
import { anatomyParts } from "../entity/anatomy.js";

export type ButtonProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  ButtonRootProps<T>
>;

export const Button = slotAware(function Button<
  T extends ValidComponent = "button",
>(props: ButtonProps<T>) {
  useKitLife(passport, props);

  const [slot, rest] = useSlot(props, "button");
  const [address, clean] = useAddress(rest, anatomyParts.root.attrs);

  return (
    <KobalteButton {...slot} {...(clean as ButtonRootProps)} {...address} />
  );
});
