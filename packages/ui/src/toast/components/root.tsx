import {
  ToastRoot as ArkRoot,
  ToastTitle as ArkTitle,
  ToastDescription as ArkDescription,
  ToastCloseTrigger as ArkCloseTrigger,
  Toaster as ArkToaster,
} from "@ark-ui/solid/toast";
import { Portal } from "solid-js/web";

import { getToaster } from "../control.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ToastProps = Record<string, never>;

export function Toast(_props: ToastProps) {
  traceLife("ui.toast");

  return (
    <Portal>
      <ArkToaster toaster={getToaster()}>
        {(item) => (
          <ArkRoot>
            <ArkTitle>{item().title}</ArkTitle>
            <ArkDescription>{item().description}</ArkDescription>
            <ArkCloseTrigger>✕</ArkCloseTrigger>
          </ArkRoot>
        )}
      </ArkToaster>
    </Portal>
  );
}
