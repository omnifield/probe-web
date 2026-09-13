import {
  FieldRoot as ArkRoot,
  type FieldRootProps as ArkRootProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type FieldProps = ArkRootProps;

export function Field(props: FieldProps) {
  const validation = useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} invalid={validation()?.invalid} />;
}
