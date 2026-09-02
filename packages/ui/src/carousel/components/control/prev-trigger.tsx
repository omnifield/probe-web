import {
  CarouselPrevTrigger as ArkPrevTrigger,
  type CarouselPrevTriggerProps as ArkPrevTriggerProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type CarouselPrevTriggerProps = ArkPrevTriggerProps;

export function CarouselPrevTrigger(props: CarouselPrevTriggerProps) {
  traceLife("ui.carousel-prev-trigger");

  return <ArkPrevTrigger {...dropAddress(props)} />;
}
