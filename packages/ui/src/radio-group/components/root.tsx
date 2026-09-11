import {
  RadioGroupRoot as ArkRoot,
  type RadioGroupRootProps as ArkRootProps,
} from "@ark-ui/solid/radio-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type RadioGroupProps = ArkRootProps;

export function RadioGroup(props: RadioGroupProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
