import {
  FileUploadItemDeleteTrigger as ArkItemDeleteTrigger,
  type FileUploadItemDeleteTriggerProps as ArkItemDeleteTriggerProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type FileUploadItemDeleteTriggerProps = ArkItemDeleteTriggerProps;

export function FileUploadItemDeleteTrigger(props: FileUploadItemDeleteTriggerProps) {
  traceLife("ui.file-upload-item-delete-trigger");

  return <ArkItemDeleteTrigger {...dropAddress(props)} />;
}
