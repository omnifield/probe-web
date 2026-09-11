import {
  DatePickerRoot as ArkRoot,
  type DatePickerRootProps as ArkRootProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type DatePickerProps = ArkRootProps;

export function DatePicker(props: DatePickerProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
