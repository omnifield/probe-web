import {
  FileUploadClearTrigger as ArkClearTrigger,
  FileUploadDropzone as ArkDropzone,
  FileUploadHiddenInput as ArkHiddenInput,
  FileUploadItem as ArkItem,
  FileUploadItemDeleteTrigger as ArkItemDeleteTrigger,
  FileUploadItemGroup as ArkItemGroup,
  FileUploadItemName as ArkItemName,
  FileUploadItemPreview as ArkItemPreview,
  FileUploadItemPreviewImage as ArkItemPreviewImage,
  FileUploadItemSizeText as ArkItemSizeText,
  FileUploadLabel as ArkLabel,
  FileUploadRoot as ArkRoot,
  FileUploadTrigger as ArkTrigger,
  type FileUploadClearTriggerProps as ArkClearTriggerProps,
  type FileUploadDropzoneProps as ArkDropzoneProps,
  type FileUploadHiddenInputProps as ArkHiddenInputProps,
  type FileUploadItemDeleteTriggerProps as ArkItemDeleteTriggerProps,
  type FileUploadItemGroupProps as ArkItemGroupProps,
  type FileUploadItemNameProps as ArkItemNameProps,
  type FileUploadItemPreviewImageProps as ArkItemPreviewImageProps,
  type FileUploadItemPreviewProps as ArkItemPreviewProps,
  type FileUploadItemProps as ArkItemProps,
  type FileUploadItemSizeTextProps as ArkItemSizeTextProps,
  type FileUploadLabelProps as ArkLabelProps,
  type FileUploadRootProps as ArkRootProps,
  type FileUploadTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/file-upload";

import { dropAddress } from "../../slot-chain.js";
import { traceLife } from "../../trace.js";

// File upload — a dropzone plus a list of picked files, from Ark
// (`ark-ui.com/docs/components/file-upload`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/file-upload`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `file-upload.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// Each `itemXxx` part takes a `file`/`type` pair identifying WHICH picked file it draws for
// (`type` is `"accepted"` or `"rejected"` — which list the file landed in); the kit reads them
// back off `file`/`type`, not off DOM position, so items can be reordered freely by the consumer.

/** Props of `FileUpload` — the root. */
export type FileUploadProps = ArkRootProps;

/**
 * The file upload's root — holds accepted/rejected files and the drag state.
 *
 * @example
 * ```tsx
 * <FileUpload>
 *   <FileUploadLabel>Attachments</FileUploadLabel>
 *   <FileUploadDropzone>
 *     <FileUploadTrigger>Browse</FileUploadTrigger>
 *   </FileUploadDropzone>
 *   <FileUploadItemGroup>
 *     <For each={api().acceptedFiles}>{(file) => <FileUploadItem file={file} />}</For>
 *   </FileUploadItemGroup>
 *   <FileUploadClearTrigger>Clear all</FileUploadClearTrigger>
 *   <FileUploadHiddenInput />
 * </FileUpload>
 * ```
 */
export function FileUpload(props: FileUploadProps) {
  traceLife("ui.file-upload");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `FileUploadLabel`. */
export type FileUploadLabelProps = ArkLabelProps;

/** The whole widget's own label — ONE node, wired to the hidden input via `htmlFor`. */
export function FileUploadLabel(props: FileUploadLabelProps) {
  traceLife("ui.file-upload-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `FileUploadDropzone`. */
export type FileUploadDropzoneProps = ArkDropzoneProps;

/** The drop target — ONE node; click opens the file picker, drag-and-drop is wired natively. */
export function FileUploadDropzone(props: FileUploadDropzoneProps) {
  traceLife("ui.file-upload-dropzone");

  return <ArkDropzone {...dropAddress(props)} />;
}

/** Props of `FileUploadTrigger`. */
export type FileUploadTriggerProps = ArkTriggerProps;

/** Opens the file picker explicitly — a real `<button>`, optional alongside (or instead of) `dropzone`'s own click. */
export function FileUploadTrigger(props: FileUploadTriggerProps) {
  traceLife("ui.file-upload-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}

/** Props of `FileUploadHiddenInput`. */
export type FileUploadHiddenInputProps = ArkHiddenInputProps;

/**
 * The real, hidden `<input type="file">` — the native file picker and form participation live
 * here.
 *
 * Carries no address (`../entity/passport.ts`, "the hidden input, again"): a part the provider
 * never addressed is not addressable by us either.
 */
export function FileUploadHiddenInput(props: FileUploadHiddenInputProps) {
  traceLife("ui.file-upload-hidden-input");

  return <ArkHiddenInput {...dropAddress(props)} />;
}

/** Props of `FileUploadItemGroup`. */
export type FileUploadItemGroupProps = ArkItemGroupProps;

/** Wraps a list of items — one group for accepted files, a second (optional) for rejected ones. */
export function FileUploadItemGroup(props: FileUploadItemGroupProps) {
  traceLife("ui.file-upload-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}

/** Props of `FileUploadItem`. */
export type FileUploadItemProps = ArkItemProps;

/** One picked file's own row — `file` is required. */
export function FileUploadItem(props: FileUploadItemProps) {
  traceLife("ui.file-upload-item");

  return <ArkItem {...dropAddress(props)} />;
}

/** Props of `FileUploadItemName`. */
export type FileUploadItemNameProps = ArkItemNameProps;

/** The file's own name — ONE node, text set by the consumer (typically `file.name`). */
export function FileUploadItemName(props: FileUploadItemNameProps) {
  traceLife("ui.file-upload-item-name");

  return <ArkItemName {...dropAddress(props)} />;
}

/** Props of `FileUploadItemSizeText`. */
export type FileUploadItemSizeTextProps = ArkItemSizeTextProps;

/** The file's own formatted size — ONE node, text is the consumer's own (e.g. `api.getFileSize(file)`). */
export function FileUploadItemSizeText(props: FileUploadItemSizeTextProps) {
  traceLife("ui.file-upload-item-size-text");

  return <ArkItemSizeText {...dropAddress(props)} />;
}

/** Props of `FileUploadItemPreview`. */
export type FileUploadItemPreviewProps = ArkItemPreviewProps;

/** Wraps a file's preview — an image thumbnail, or a generic icon for non-image files. */
export function FileUploadItemPreview(props: FileUploadItemPreviewProps) {
  traceLife("ui.file-upload-item-preview");

  return <ArkItemPreview {...dropAddress(props)} />;
}

/** Props of `FileUploadItemPreviewImage`. */
export type FileUploadItemPreviewImageProps = ArkItemPreviewImageProps;

/** The actual thumbnail — a real `<img>`; throws if the file is not an image (Ark's own guard, not this wrapper's). */
export function FileUploadItemPreviewImage(props: FileUploadItemPreviewImageProps) {
  traceLife("ui.file-upload-item-preview-image");

  return <ArkItemPreviewImage {...dropAddress(props)} />;
}

/** Props of `FileUploadItemDeleteTrigger`. */
export type FileUploadItemDeleteTriggerProps = ArkItemDeleteTriggerProps;

/** Removes ONE file — a real `<button>`, no graphic of its own. */
export function FileUploadItemDeleteTrigger(props: FileUploadItemDeleteTriggerProps) {
  traceLife("ui.file-upload-item-delete-trigger");

  return <ArkItemDeleteTrigger {...dropAddress(props)} />;
}

/** Props of `FileUploadClearTrigger`. */
export type FileUploadClearTriggerProps = ArkClearTriggerProps;

/** Removes every accepted file at once — a real `<button>`, hidden by the kit while none are picked. */
export function FileUploadClearTrigger(props: FileUploadClearTriggerProps) {
  traceLife("ui.file-upload-clear-trigger");

  return <ArkClearTrigger {...dropAddress(props)} />;
}
