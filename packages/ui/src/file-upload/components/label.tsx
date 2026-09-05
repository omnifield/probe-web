import {
  FileUploadLabel as ArkLabel,
  type FileUploadLabelProps as ArkLabelProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FileUploadLabelProps = ArkLabelProps;

export function FileUploadLabel(props: FileUploadLabelProps) {
  traceLife("ui.file-upload-label");

  return <ArkLabel {...dropAddress(props)} />;
}
