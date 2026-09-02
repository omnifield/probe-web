import {
  FileUploadDropzone as ArkDropzone,
  type FileUploadDropzoneProps as ArkDropzoneProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FileUploadDropzoneProps = ArkDropzoneProps;

export function FileUploadDropzone(props: FileUploadDropzoneProps) {
  traceLife("ui.file-upload-dropzone");

  return <ArkDropzone {...dropAddress(props)} />;
}
