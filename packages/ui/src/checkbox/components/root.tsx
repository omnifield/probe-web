import {
  CheckboxHiddenInput as ArkHiddenInput,
  CheckboxRoot as ArkRoot,
  type CheckboxRootProps as ArkRootProps,
} from "@ark-ui/solid/checkbox";

import { splitProps } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type CheckboxProps = ArkRootProps;

export function Checkbox(props: CheckboxProps) {
  useKitLife(passport, props);

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      {local.children}
      <ArkHiddenInput />
    </ArkRoot>
  );
}
