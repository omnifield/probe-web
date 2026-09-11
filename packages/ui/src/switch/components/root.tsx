import {
  SwitchHiddenInput as ArkHiddenInput,
  SwitchRoot as ArkRoot,
  type SwitchRootProps as ArkRootProps,
} from "@ark-ui/solid/switch";
import { splitProps } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type SwitchProps = ArkRootProps;

export function Switch(props: SwitchProps) {
  useKitLife(passport, props);

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      {local.children}
      <ArkHiddenInput />
    </ArkRoot>
  );
}
