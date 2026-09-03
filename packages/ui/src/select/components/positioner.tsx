import {
  SelectPositioner as ArkPositioner,
  type SelectPositionerProps as ArkPositionerProps,
} from "@ark-ui/solid/select";
import { Portal } from "solid-js/web";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectPositionerProps = ArkPositionerProps;

/** Portal'ed to `document.body` — without it, a later unrelated sibling elsewhere on a real page silently absorbed every click (found live, `PWEB-` 2026-08-30). */
export function SelectPositioner(props: SelectPositionerProps) {
  traceLife("ui.select-positioner");

  return (
    <Portal>
      <ArkPositioner {...dropAddress(props)} />
    </Portal>
  );
}
