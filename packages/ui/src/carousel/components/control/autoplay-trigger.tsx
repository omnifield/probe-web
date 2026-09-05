import {
  CarouselAutoplayTrigger as ArkAutoplayTrigger,
  type CarouselAutoplayTriggerProps as ArkAutoplayTriggerProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type CarouselAutoplayTriggerProps = ArkAutoplayTriggerProps;

export function CarouselAutoplayTrigger(props: CarouselAutoplayTriggerProps) {
  traceLife("ui.carousel-autoplay-trigger");

  return <ArkAutoplayTrigger {...dropAddress(props)} />;
}
