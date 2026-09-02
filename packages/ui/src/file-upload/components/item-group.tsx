import {
  FileUploadItemGroup as ArkItemGroup,
  type FileUploadItemGroupProps as ArkItemGroupProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FileUploadItemGroupProps = ArkItemGroupProps;

export function FileUploadItemGroup(props: FileUploadItemGroupProps) {
  traceLife("ui.file-upload-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}
