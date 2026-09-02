import {
  FileUploadItemName as ArkItemName,
  type FileUploadItemNameProps as ArkItemNameProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type FileUploadItemNameProps = ArkItemNameProps;

export function FileUploadItemName(props: FileUploadItemNameProps) {
  traceLife("ui.file-upload-item-name");

  return <ArkItemName {...dropAddress(props)} />;
}
