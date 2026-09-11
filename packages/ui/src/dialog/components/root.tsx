import {
  DialogRoot as ArkRoot,
  type DialogRootProps as ArkRootProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type DialogProps = ArkRootProps;

export function Dialog(props: DialogProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
