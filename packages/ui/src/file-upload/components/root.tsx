import {
  FileUploadHiddenInput as ArkHiddenInput,
  FileUploadRoot as ArkRoot,
  type FileUploadRootProps as ArkRootProps,
} from "@ark-ui/solid/file-upload";
import { splitProps } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FileUploadProps = ArkRootProps;

export function FileUpload(props: FileUploadProps) {
  traceLife("ui.file-upload");

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      {local.children}
      <ArkHiddenInput />
    </ArkRoot>
  );
}
