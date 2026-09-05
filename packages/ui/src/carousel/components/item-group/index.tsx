import {
  CarouselItemGroup as ArkItemGroup,
  type CarouselItemGroupProps as ArkItemGroupProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type CarouselItemGroupProps = ArkItemGroupProps;

export function CarouselItemGroup(props: CarouselItemGroupProps) {
  traceLife("ui.carousel-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}
