import {
  FieldErrorText as ArkErrorText,
  type FieldErrorTextProps as ArkErrorTextProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type FieldErrorTextProps = ArkErrorTextProps;

export function FieldErrorText(props: FieldErrorTextProps) {
  const validation = useKitLife(passport, props);

  return <ArkErrorText {...dropAddress(props)}>{validation()?.errorText}</ArkErrorText>;
}
