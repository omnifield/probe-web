import {
  CarouselProgressText as ArkProgressText,
  type CarouselProgressTextProps as ArkProgressTextProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type CarouselProgressTextProps = ArkProgressTextProps;

export function CarouselProgressText(props: CarouselProgressTextProps) {
  traceLife("ui.carousel-progress-text");

  return <ArkProgressText {...dropAddress(props)} />;
}
