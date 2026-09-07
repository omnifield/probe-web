import {
  DialogBackdrop as ArkBackdrop,
  DialogCloseTrigger as ArkCloseTrigger,
  DialogContent as ArkContent,
  type DialogContentProps as ArkContentProps,
} from "@ark-ui/solid/dialog";
import { Portal } from "solid-js/web";

import { remove } from "../control";
import { traceLife } from "../../../shared/utils/trace.js";

export type DialogContentProps = ArkContentProps;

export function DialogContent(props: DialogContentProps) {
  traceLife("ui.toast-content");

  return (
    <>
       <Toast.Title className={styles.Title}>{toast.title}</Toast.Title>
              <Toast.Description className={styles.Description}>{toast.description}</Toast.Description>
              <Toast.CloseTrigger className={styles.CloseTrigger}>
                <XIcon />
              </Toast.CloseTrigger>
    </Portal>
  );
}
