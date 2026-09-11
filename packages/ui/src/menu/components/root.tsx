import {
  MenuRoot as ArkRoot,
  type MenuRootProps as ArkRootProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type MenuProps = ArkRootProps;

export function Menu(props: MenuProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
