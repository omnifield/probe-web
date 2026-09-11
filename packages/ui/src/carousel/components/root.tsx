import {
  CarouselRoot as ArkRoot,
  type CarouselRootProps as ArkRootProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type CarouselProps = ArkRootProps;

export function Carousel(props: CarouselProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
