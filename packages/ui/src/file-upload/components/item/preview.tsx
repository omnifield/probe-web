import {
  FileUploadItemPreview as ArkItemPreview,
  type FileUploadItemPreviewProps as ArkItemPreviewProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type FileUploadItemPreviewProps = ArkItemPreviewProps;

export function FileUploadItemPreview(props: FileUploadItemPreviewProps) {
  traceLife("ui.file-upload-item-preview");

  return <ArkItemPreview {...dropAddress(props)} />;
}
