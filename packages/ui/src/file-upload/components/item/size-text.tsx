import {
  FileUploadItemSizeText as ArkItemSizeText,
  type FileUploadItemSizeTextProps as ArkItemSizeTextProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type FileUploadItemSizeTextProps = ArkItemSizeTextProps;

export function FileUploadItemSizeText(props: FileUploadItemSizeTextProps) {
  traceLife("ui.file-upload-item-size-text");

  return <ArkItemSizeText {...dropAddress(props)} />;
}
