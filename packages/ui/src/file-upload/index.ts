// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  FileUpload,
  FileUploadClearTrigger,
  type FileUploadClearTriggerProps,
  FileUploadDropzone,
  type FileUploadDropzoneProps,
  FileUploadHiddenInput,
  type FileUploadHiddenInputProps,
  FileUploadItem,
  FileUploadItemDeleteTrigger,
  type FileUploadItemDeleteTriggerProps,
  FileUploadItemGroup,
  type FileUploadItemGroupProps,
  FileUploadItemName,
  type FileUploadItemNameProps,
  FileUploadItemPreview,
  FileUploadItemPreviewImage,
  type FileUploadItemPreviewImageProps,
  type FileUploadItemPreviewProps,
  type FileUploadItemProps,
  FileUploadItemSizeText,
  type FileUploadItemSizeTextProps,
  FileUploadLabel,
  type FileUploadLabelProps,
  type FileUploadProps,
  FileUploadTrigger,
  type FileUploadTriggerProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
