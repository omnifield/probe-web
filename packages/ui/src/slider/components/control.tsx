import {
  SliderControl as ArkControl,
  type SliderControlProps as ArkControlProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SliderControlProps = ArkControlProps;

export function SliderControl(props: SliderControlProps) {
  traceLife("ui.slider-control");

  return <ArkControl {...dropAddress(props)} />;
}
