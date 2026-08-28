// EDITOR-ONLY per-part taxonomy for the file upload — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type FileUploadPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const disabledMeans = { disabled: { means: "the whole widget is disabled" } } satisfies PassportPartEditorInfo<FileUploadPart>["states"];
const disabledReadonlyMeans = {
  disabled: { means: "the whole widget is disabled" },
  readonly: { means: "the value is visible, changing it is not possible" },
} satisfies PassportPartEditorInfo<FileUploadPart>["states"];
const itemTypeMeans = {
  accepted: { means: "this file landed in the accepted list" },
  rejected: { means: "this file was rejected (size, type, or count)" },
} satisfies PassportPartEditorInfo<FileUploadPart>["states"];
const buttonPseudoMeans = {
  hover: { means: "pointer is over this button" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
  active: { means: "this button is being held down" },
} satisfies PassportPartEditorInfo<FileUploadPart>["states"];

export const parts: Readonly<Record<FileUploadPart, PassportPartEditorInfo<FileUploadPart>>> = {
  root: {
    means: "the whole file upload — label, dropzone, and the picked-file list together",
    states: { ...disabledReadonlyMeans, dragging: { means: "a file is being dragged over the widget" } },
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "dropzone" },
      { kind: "component", name: "itemGroup" },
      { kind: "component", name: "clearTrigger" },
      // The real hidden `<input type="file">` (`PWEB-152`) — the native file picker and form
      // participation live on that exact node, no address of its own.
      { kind: "component", name: "hiddenInput" },
    ],
  },
  dropzone: {
    means: "the drop target — click opens the file picker, drag-and-drop is wired natively",
    states: {
      ...disabledReadonlyMeans,
      dragging: { means: "a file is being dragged over the dropzone right now" },
      invalid: { means: "the file(s) just dropped or picked failed validation" },
    },
    accepts: [
      { kind: "component", name: "trigger" },
      { kind: "content", genus: "text" },
    ],
  },
  label: {
    means: "the whole widget's own label",
    states: { ...disabledMeans, required: { means: "the form will demand a file on submit" } },
    accepts: [{ kind: "content", genus: "text" }],
  },
  trigger: {
    means: "opens the file picker explicitly — optional alongside the dropzone's own click",
    states: { ...disabledReadonlyMeans, invalid: { means: "the file(s) just picked failed validation" }, ...buttonPseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  clearTrigger: {
    means: "removes every accepted file at once — hidden by the kit while none are picked",
    states: { ...disabledReadonlyMeans, ...buttonPseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  itemGroup: {
    means: "wraps a list of picked files — one group for accepted, a second optional one for rejected",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [{ kind: "component", name: "item" }],
  },
  item: {
    means: "one picked file's own row",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [
      { kind: "component", name: "itemPreview" },
      { kind: "component", name: "itemName" },
      { kind: "component", name: "itemSizeText" },
      { kind: "component", name: "itemDeleteTrigger" },
    ],
  },
  itemName: {
    means: "the file's own name",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemSizeText: {
    means: "the file's own formatted size",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemPreview: {
    means: "wraps a file's preview — an image thumbnail, or a generic icon for non-image files",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [
      { kind: "component", name: "itemPreviewImage" },
      { kind: "content", genus: "icon" },
    ],
  },
  itemPreviewImage: {
    means: "the actual thumbnail — only ever mounted for an accepted, image-typed file",
    states: { ...disabledMeans, ...itemTypeMeans },
    // Occupied — a real <img>, no consumer content.
    accepts: [],
  },
  itemDeleteTrigger: {
    means: "removes one file",
    states: { ...disabledReadonlyMeans, ...itemTypeMeans, ...buttonPseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
