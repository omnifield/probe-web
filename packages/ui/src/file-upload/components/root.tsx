import {
  FileUploadHiddenInput as ArkHiddenInput,
  FileUploadRoot as ArkRoot,
  type FileUploadRootProps as ArkRootProps,
} from "@ark-ui/solid/file-upload";
import { splitProps } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type FileUploadProps = ArkRootProps;

export function FileUpload(props: FileUploadProps) {
  useKitLife(passport, props);

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      {local.children}
      <ArkHiddenInput />
    </ArkRoot>
  );
}
