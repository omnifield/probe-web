import {
  CarouselRoot as ArkRoot,
  type CarouselRootProps as ArkRootProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type CarouselProps = ArkRootProps;

export function Carousel(props: CarouselProps) {
  traceLife("ui.carousel");

  return <ArkRoot {...dropAddress(props)} />;
}
