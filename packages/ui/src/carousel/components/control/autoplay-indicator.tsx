import {
  CarouselAutoplayIndicator as ArkAutoplayIndicator,
  type CarouselAutoplayIndicatorProps as ArkAutoplayIndicatorProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type CarouselAutoplayIndicatorProps = ArkAutoplayIndicatorProps;

export function CarouselAutoplayIndicator(props: CarouselAutoplayIndicatorProps) {
  traceLife("ui.carousel-autoplay-indicator");

  return <ArkAutoplayIndicator {...dropAddress(props)} />;
}
