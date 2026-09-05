import {
  CarouselControl as ArkControl,
  type CarouselControlProps as ArkControlProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type CarouselControlProps = ArkControlProps;

export function CarouselControl(props: CarouselControlProps) {
  traceLife("ui.carousel-control");

  return <ArkControl {...dropAddress(props)} />;
}
