import {
  SwitchHiddenInput as ArkHiddenInput,
  SwitchRoot as ArkRoot,
  type SwitchRootProps as ArkRootProps,
} from "@ark-ui/solid/switch";
import { splitProps } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SwitchProps = ArkRootProps;

export function Switch(props: SwitchProps) {
  traceLife("ui.switch");

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      {local.children}
      <ArkHiddenInput />
    </ArkRoot>
  );
}
