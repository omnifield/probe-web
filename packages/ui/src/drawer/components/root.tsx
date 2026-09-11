import {
  DrawerRoot as ArkRoot,
  type DrawerRootProps as ArkRootProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type DrawerProps = ArkRootProps;

export function Drawer(props: DrawerProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
