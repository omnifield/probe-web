import {
  FileUploadItem as ArkItem,
  type FileUploadItemProps as ArkItemProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type FileUploadItemProps = ArkItemProps;

export function FileUploadItem(props: FileUploadItemProps) {
  traceLife("ui.file-upload-item");

  return <ArkItem {...dropAddress(props)} />;
}
