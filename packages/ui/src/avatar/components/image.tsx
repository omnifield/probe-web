import {
  AvatarImage as ArkImage,
  type AvatarImageProps as ArkImageProps,
} from "@ark-ui/solid/avatar";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type AvatarImageProps = ArkImageProps;

export function AvatarImage(props: AvatarImageProps) {
  traceLife("ui.avatar-image");

  return <ArkImage {...dropAddress(props)} />;
}
