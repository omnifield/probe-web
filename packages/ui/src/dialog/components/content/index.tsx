import {
  DialogContent as ArkContent,
  type DialogContentProps as ArkContentProps,
} from "@ark-ui/solid/dialog";
import { Portal } from "solid-js/web";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { DialogBackdrop } from "../backdrop.js";
import { DialogPositioner } from "../positioner.js";

export type DialogContentProps = ArkContentProps;

/**
 * Несёт `Portal`, `backdrop` и `positioner` сама — снаружи у диалога всего две составные части,
 * `DialogTrigger` и `DialogContent`. Потребителю не нужно класть `DialogBackdrop`/
 * `DialogPositioner` отдельно и оборачивать их в `Portal` вручную, как того требуют примеры на
 * ark-ui.com — один `Portal` на весь диалог, не по одному на каждую всплывающую часть.
 */
export function DialogContent(props: DialogContentProps) {
  traceLife("ui.dialog-content");

  return (
    <Portal>
      <DialogBackdrop />
      <DialogPositioner>
        <ArkContent {...dropAddress(props)} />
      </DialogPositioner>
    </Portal>
  );
}
