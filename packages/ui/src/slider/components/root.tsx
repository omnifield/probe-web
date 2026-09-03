import {
  SliderRoot as ArkRoot,
  type SliderRootProps as ArkRootProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SliderProps = ArkRootProps;

export function Slider(props: SliderProps) {
  traceLife("ui.slider");

  return <ArkRoot {...dropAddress(props)} />;
}
