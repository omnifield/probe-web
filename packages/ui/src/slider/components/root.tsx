import {
  SliderRoot as ArkRoot,
  type SliderRootProps as ArkRootProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type SliderProps = ArkRootProps;

export function Slider(props: SliderProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
