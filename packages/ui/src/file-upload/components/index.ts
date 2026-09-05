export { FileUpload, type FileUploadProps } from "./root.js";
export { FileUploadLabel, type FileUploadLabelProps } from "./label.js";
export { FileUploadDropzone, type FileUploadDropzoneProps } from "./dropzone.js";
export { FileUploadTrigger, type FileUploadTriggerProps } from "./trigger.js";
export { FileUploadClearTrigger, type FileUploadClearTriggerProps } from "./clear-trigger.js";
export { FileUploadItemGroup, type FileUploadItemGroupProps } from "./item-group.js";
export { FileUploadItem, type FileUploadItemProps } from "./item/index.js";
export { FileUploadItemName, type FileUploadItemNameProps } from "./item/name.js";
export { FileUploadItemSizeText, type FileUploadItemSizeTextProps } from "./item/size-text.js";
export { FileUploadItemPreview, type FileUploadItemPreviewProps } from "./item/preview.js";
export { FileUploadItemPreviewImage, type FileUploadItemPreviewImageProps } from "./item/preview-image.js";
export { FileUploadItemDeleteTrigger, type FileUploadItemDeleteTriggerProps } from "./item/delete-trigger.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { FileUpload } from "./root.js";
import { FileUploadLabel } from "./label.js";
import { FileUploadDropzone } from "./dropzone.js";
import { FileUploadTrigger } from "./trigger.js";
import { FileUploadClearTrigger } from "./clear-trigger.js";
import { FileUploadItemGroup } from "./item-group.js";
import { FileUploadItem } from "./item/index.js";
import { FileUploadItemName } from "./item/name.js";
import { FileUploadItemSizeText } from "./item/size-text.js";
import { FileUploadItemPreview } from "./item/preview.js";
import { FileUploadItemPreviewImage } from "./item/preview-image.js";
import { FileUploadItemDeleteTrigger } from "./item/delete-trigger.js";

export const kit = defineKitComponent(passport, {
  root: FileUpload,
  label: FileUploadLabel,
  dropzone: FileUploadDropzone,
  trigger: FileUploadTrigger,
  clearTrigger: FileUploadClearTrigger,
  itemGroup: FileUploadItemGroup,
  item: FileUploadItem,
  itemName: FileUploadItemName,
  itemSizeText: FileUploadItemSizeText,
  itemPreview: FileUploadItemPreview,
  itemPreviewImage: FileUploadItemPreviewImage,
  itemDeleteTrigger: FileUploadItemDeleteTrigger,
});
