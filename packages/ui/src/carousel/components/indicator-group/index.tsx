import {
  CarouselIndicatorGroup as ArkIndicatorGroup,
  type CarouselIndicatorGroupProps as ArkIndicatorGroupProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type CarouselIndicatorGroupProps = ArkIndicatorGroupProps;

export function CarouselIndicatorGroup(props: CarouselIndicatorGroupProps) {
  traceLife("ui.carousel-indicator-group");

  return <ArkIndicatorGroup {...dropAddress(props)} />;
}
