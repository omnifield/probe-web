import {
  AvatarRoot as ArkRoot,
  type AvatarRootProps as ArkRootProps,
} from "@ark-ui/solid/avatar";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type AvatarProps = ArkRootProps;

export function Avatar(props: AvatarProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
