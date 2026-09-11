import {
  ToggleRoot as ArkRoot,
  type ToggleRootProps as ArkRootProps,
} from "@ark-ui/solid/toggle";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type ToggleProps = ArkRootProps;

export function Toggle(props: ToggleProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
