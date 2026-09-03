import {
  SelectValueText as ArkValueText,
  type SelectValueTextProps as ArkValueTextProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectValueTextProps = ArkValueTextProps;

export function SelectValueText(props: SelectValueTextProps) {
  traceLife("ui.select-value-text");

  return <ArkValueText {...dropAddress(props)} />;
}
