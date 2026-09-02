import {
  CarouselIndicator as ArkIndicator,
  type CarouselIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type CarouselIndicatorProps = ArkIndicatorProps;

export function CarouselIndicator(props: CarouselIndicatorProps) {
  traceLife("ui.carousel-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
