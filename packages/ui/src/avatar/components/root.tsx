import {
  AvatarRoot as ArkRoot,
  type AvatarRootProps as ArkRootProps,
} from "@ark-ui/solid/avatar";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type AvatarProps = ArkRootProps;

export function Avatar(props: AvatarProps) {
  traceLife("ui.avatar");

  return <ArkRoot {...dropAddress(props)} />;
}
