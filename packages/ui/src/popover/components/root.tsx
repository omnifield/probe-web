import {
  PopoverRoot as ArkRoot,
  type PopoverRootProps as ArkRootProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type PopoverProps = ArkRootProps;

export function Popover(props: PopoverProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
