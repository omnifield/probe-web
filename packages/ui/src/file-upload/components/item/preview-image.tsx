import {
  FileUploadItemPreviewImage as ArkItemPreviewImage,
  type FileUploadItemPreviewImageProps as ArkItemPreviewImageProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type FileUploadItemPreviewImageProps = ArkItemPreviewImageProps;

export function FileUploadItemPreviewImage(props: FileUploadItemPreviewImageProps) {
  traceLife("ui.file-upload-item-preview-image");

  return <ArkItemPreviewImage {...dropAddress(props)} />;
}
