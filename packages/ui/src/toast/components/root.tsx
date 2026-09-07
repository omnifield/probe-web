import {
  ToastRoot as ArkRoot,
  type ToastRootProps as ArkRootProps,
} from "@ark-ui/solid/toast";

import { getToaster } from "./control";
import { traceLife } from "../../shared/utils/trace.js";

export type ToastProps = ArkRootProps;

export function Toast(props: ToastProps) {
  traceLife("ui.toast");

  return (
    <Portal>
      <Toaster toaster={getToaster()}>
        {(toast) => (
          <Toast.Root key={toast.id} className={styles.Root}>
            //....
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  );
}
