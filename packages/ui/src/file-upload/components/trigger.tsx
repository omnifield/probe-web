import {
  FileUploadTrigger as ArkTrigger,
  type FileUploadTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FileUploadTriggerProps = ArkTriggerProps;

export function FileUploadTrigger(props: FileUploadTriggerProps) {
  traceLife("ui.file-upload-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}
