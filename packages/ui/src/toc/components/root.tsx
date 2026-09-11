import {
  TocRoot as ArkRoot,
  type TocRootProps as ArkRootProps,
} from "@ark-ui/solid/toc";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type TocProps = ArkRootProps;

export function Toc(props: TocProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
