import {
  AvatarFallback as ArkFallback,
  type AvatarFallbackProps as ArkFallbackProps,
} from "@ark-ui/solid/avatar";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type AvatarFallbackProps = ArkFallbackProps;

export function AvatarFallback(props: AvatarFallbackProps) {
  traceLife("ui.avatar-fallback");

  return <ArkFallback {...dropAddress(props)} />;
}
