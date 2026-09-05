import {
  RadioGroupItem as ArkItem,
  RadioGroupItemHiddenInput as ArkItemHiddenInput,
  type RadioGroupItemProps as ArkItemProps,
} from "@ark-ui/solid/radio-group";

import { splitProps } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type RadioGroupItemProps = ArkItemProps;

export function RadioGroupItem(props: RadioGroupItemProps) {
  traceLife("ui.radio-group-item");

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkItem {...dropAddress(rest)}>
      {local.children}
      <ArkItemHiddenInput />
    </ArkItem>
  );
}
