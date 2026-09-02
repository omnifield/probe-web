import {
  CarouselNextTrigger as ArkNextTrigger,
  type CarouselNextTriggerProps as ArkNextTriggerProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type CarouselNextTriggerProps = ArkNextTriggerProps;

export function CarouselNextTrigger(props: CarouselNextTriggerProps) {
  traceLife("ui.carousel-next-trigger");

  return <ArkNextTrigger {...dropAddress(props)} />;
}
