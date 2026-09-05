import {
  CheckboxHiddenInput as ArkHiddenInput,
  CheckboxRoot as ArkRoot,
  type CheckboxRootProps as ArkRootProps,
} from "@ark-ui/solid/checkbox";

import { splitProps } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type CheckboxProps = ArkRootProps;

export function Checkbox(props: CheckboxProps) {
  traceLife("ui.checkbox");

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      {local.children}
      <ArkHiddenInput />
    </ArkRoot>
  );
}
