import {
  ScrollAreaRoot as ArkRoot,
  type ScrollAreaRootProps as ArkRootProps,
} from "@ark-ui/solid/scroll-area";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type ScrollAreaProps = ArkRootProps;

export function ScrollArea(props: ScrollAreaProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
