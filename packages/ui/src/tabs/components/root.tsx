import {
  TabsRoot as ArkRoot,
  type TabsRootProps as ArkRootProps,
} from "@ark-ui/solid/tabs";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type TabsProps = ArkRootProps;

export function Tabs(props: TabsProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
