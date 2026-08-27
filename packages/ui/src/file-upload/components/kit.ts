// MAP of the file upload: passport part → the component that draws it (`PWEB-84`).
//
// `hiddenInput` sits outside `parts` — it has no part in the passport (`../entity/anatomy.ts`),
// and `parts`' keys are checked against the anatomy's parts, not against every node the
// components render. It lives in `extras` instead (`PWEB-152`): a real, addressable-by-name-only
// component an assembly tree can still place — the native file picker and form participation live
// on that exact node.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  FileUpload,
  FileUploadClearTrigger,
  FileUploadDropzone,
  FileUploadHiddenInput,
  FileUploadItem,
  FileUploadItemDeleteTrigger,
  FileUploadItemGroup,
  FileUploadItemName,
  FileUploadItemPreview,
  FileUploadItemPreviewImage,
  FileUploadItemSizeText,
  FileUploadLabel,
  FileUploadTrigger,
} from "./index.jsx";

/** The file upload's passport together with whatever draws each of its twelve parts. */
export const kit = defineKitComponent(
  passport,
  {
    root: FileUpload,
    dropzone: FileUploadDropzone,
    label: FileUploadLabel,
    trigger: FileUploadTrigger,
    clearTrigger: FileUploadClearTrigger,
    itemGroup: FileUploadItemGroup,
    item: FileUploadItem,
    itemName: FileUploadItemName,
    itemSizeText: FileUploadItemSizeText,
    itemPreview: FileUploadItemPreview,
    itemPreviewImage: FileUploadItemPreviewImage,
    itemDeleteTrigger: FileUploadItemDeleteTrigger,
  },
  { hiddenInput: FileUploadHiddenInput },
);
