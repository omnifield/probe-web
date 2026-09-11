import {
  ToggleGroupRoot as ArkRoot,
  type ToggleGroupRootProps as ArkRootProps,
} from "@ark-ui/solid/toggle-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type ToggleGroupProps = ArkRootProps;

export function ToggleGroup(props: ToggleGroupProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
