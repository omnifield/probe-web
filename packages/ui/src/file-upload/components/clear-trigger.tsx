import {
  FileUploadClearTrigger as ArkClearTrigger,
  type FileUploadClearTriggerProps as ArkClearTriggerProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FileUploadClearTriggerProps = ArkClearTriggerProps;

export function FileUploadClearTrigger(props: FileUploadClearTriggerProps) {
  traceLife("ui.file-upload-clear-trigger");

  return <ArkClearTrigger {...dropAddress(props)} />;
}
