import {
  CarouselItem as ArkItem,
  type CarouselItemProps as ArkItemProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type CarouselItemProps = ArkItemProps;

export function CarouselItem(props: CarouselItemProps) {
  traceLife("ui.carousel-item");

  return <ArkItem {...dropAddress(props)} />;
}
