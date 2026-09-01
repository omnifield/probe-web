# File Upload

**Group:** inputs · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| root | the whole file upload — label, dropzone, and the picked-file list together |
| dropzone | the drop target — click opens the file picker, drag-and-drop is wired natively |
| label | the whole widget's own label |
| trigger | opens the file picker explicitly — optional alongside the dropzone's own click |
| clearTrigger | removes every accepted file at once — hidden by the kit while none are picked |
| itemGroup | wraps a list of picked files — one group for accepted, a second optional one for rejected |
| item | one picked file's own row |
| itemName | the file's own name |
| itemSizeText | the file's own formatted size |
| itemPreview | wraps a file's preview — an image thumbnail, or a generic icon for non-image files |
| itemPreviewImage | the actual thumbnail — only ever mounted for an accepted, image-typed file |
| itemDeleteTrigger | removes one file |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | disabled | [data-disabled] | the whole widget is disabled |
| root | readonly | [data-readonly] | the value is visible, changing it is not possible |
| root | dragging | [data-dragging] | a file is being dragged over the widget |
| dropzone | disabled | [data-disabled] | the whole widget is disabled |
| dropzone | readonly | [data-readonly] | the value is visible, changing it is not possible |
| dropzone | dragging | [data-dragging] | a file is being dragged over the dropzone right now |
| dropzone | invalid | [data-invalid] | the file(s) just dropped or picked failed validation |
| label | disabled | [data-disabled] | the whole widget is disabled |
| label | required | [data-required] | the form will demand a file on submit |
| trigger | disabled | [data-disabled] | the whole widget is disabled |
| trigger | readonly | [data-readonly] | the value is visible, changing it is not possible |
| trigger | invalid | [data-invalid] | the file(s) just picked failed validation |
| trigger | hover | :hover | pointer is over this button |
| trigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| trigger | active | :active | this button is being held down |
| clearTrigger | disabled | [data-disabled] | the whole widget is disabled |
| clearTrigger | readonly | [data-readonly] | the value is visible, changing it is not possible |
| clearTrigger | hover | :hover | pointer is over this button |
| clearTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| clearTrigger | active | :active | this button is being held down |
| itemGroup | disabled | [data-disabled] | the whole widget is disabled |
| itemGroup | accepted | [data-type="accepted"] | this file landed in the accepted list |
| itemGroup | rejected | [data-type="rejected"] | this file was rejected (size, type, or count) |
| item | disabled | [data-disabled] | the whole widget is disabled |
| item | accepted | [data-type="accepted"] | this file landed in the accepted list |
| item | rejected | [data-type="rejected"] | this file was rejected (size, type, or count) |
| itemName | disabled | [data-disabled] | the whole widget is disabled |
| itemName | accepted | [data-type="accepted"] | this file landed in the accepted list |
| itemName | rejected | [data-type="rejected"] | this file was rejected (size, type, or count) |
| itemSizeText | disabled | [data-disabled] | the whole widget is disabled |
| itemSizeText | accepted | [data-type="accepted"] | this file landed in the accepted list |
| itemSizeText | rejected | [data-type="rejected"] | this file was rejected (size, type, or count) |
| itemPreview | disabled | [data-disabled] | the whole widget is disabled |
| itemPreview | accepted | [data-type="accepted"] | this file landed in the accepted list |
| itemPreview | rejected | [data-type="rejected"] | this file was rejected (size, type, or count) |
| itemPreviewImage | disabled | [data-disabled] | the whole widget is disabled |
| itemPreviewImage | accepted | [data-type="accepted"] | this file landed in the accepted list |
| itemPreviewImage | rejected | [data-type="rejected"] | this file was rejected (size, type, or count) |
| itemDeleteTrigger | disabled | [data-disabled] | the whole widget is disabled |
| itemDeleteTrigger | readonly | [data-readonly] | the value is visible, changing it is not possible |
| itemDeleteTrigger | accepted | [data-type="accepted"] | this file landed in the accepted list |
| itemDeleteTrigger | rejected | [data-type="rejected"] | this file was rejected (size, type, or count) |
| itemDeleteTrigger | hover | :hover | pointer is over this button |
| itemDeleteTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| itemDeleteTrigger | active | :active | this button is being held down |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## Notes

<!-- user:start -->
## Overview

File Upload is a dropzone plus a list of picked files — click or drag-and-drop to pick files,
validated against constraints the consumer sets, with accepted and rejected files tracked
separately. Twelve parts, the same anatomy-owns-the-address device as the rest of the Ark-provided
kit.

## Features

- **Click and drag-and-drop, both wired in** — `dropzone`'s click opens the picker; drop is native
  (`allowDrop`, default `true`, turns it off). `trigger` is an optional, explicit alternative
  alongside the dropzone's own click, not a replacement for it.
- **Real validation constraints** — `accept` (MIME types or extensions), `maxFiles` (default `1`),
  `maxFileSize`/`minFileSize` (bytes), plus a `validate` function for anything the built-in
  constraints don't cover. A file failing any of these lands in the rejected list, not the accepted
  one.
- **Accepted and rejected files are two separate lists** — `itemGroup`'s `type` prop
  (`"accepted"`/`"rejected"`) decides which list its `item`s belong to; the Solid `Item` component
  reads this from its *enclosing* `itemGroup`, not from a per-item prop — a single group can't hold
  both types at once with per-item overrides.
- **Controlled or uncontrolled accepted files** — `acceptedFiles` + `onFileChange` for controlled
  use, `defaultAcceptedFiles` for uncontrolled; `onFileAccept`/`onFileReject` fire for just one side
  each.
- **File transformation before acceptance** — `transformFiles` runs an async function (e.g. image
  compression) over incoming files before they're added to the accepted list.
- **Directory and camera capture** — `directory` (webkit-only) accepts whole folders, exposing each
  file's `webkitRelativePath`; `capture` (`"user"`/`"environment"`) opens the device camera instead
  of the file browser.
- **Type-matched previews** — `itemPreview`'s `type` prop (default `.*`, matching everything) picks
  which preview renders for a given file's MIME type; mount several `itemPreview`s with different
  `type`s side by side (e.g. `image/*` showing `itemPreviewImage`, `.*` showing a generic icon) and
  only the matching one actually renders.
- **`itemPreviewImage` throws on a non-image file** — it's a real `<img>`, and Ark's own guard
  throws if the file isn't image-typed; always pair it with a `type="image/*"` on its enclosing
  `itemPreview`, never mount it unconditionally.
- **This kit doesn't re-export Ark's `Context`/`useFileUploadContext`** — unlike Ark's own docs
  examples, which read `acceptedFiles`/`rejectedFiles`/`openFilePicker`/`getFileSize` off a context
  render prop, this kit only exposes the plain root props (`acceptedFiles`, `onFileChange`,
  `onFileAccept`, `onFileReject`). Track picked files yourself from those callbacks rather than
  reaching for a context hook that isn't exported here.
- **The real hidden `<input type="file">` carries no address** — same device as the checkbox's own
  hidden input: a part the provider never addressed isn't addressable by this kit either.
  `FileUpload`'s own root renders one automatically — an assembly never names it.

## Anatomy

```tsx
import {
  FileUpload,
  FileUploadLabel,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadItemGroup,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemPreviewImage,
  FileUploadItemName,
  FileUploadItemSizeText,
  FileUploadItemDeleteTrigger,
  FileUploadClearTrigger,
  FileUploadHiddenInput,
} from "@omnifield/probe-web-ui";

<FileUpload>
  <FileUploadLabel>{/* text */}</FileUploadLabel>
  <FileUploadDropzone>
    <FileUploadTrigger>{/* text or icon */}</FileUploadTrigger>
  </FileUploadDropzone>
  <FileUploadItemGroup type="accepted">
    {/* one FileUploadItem per accepted file; `file` is required */}
    <FileUploadItem file={someFile}>
      <FileUploadItemPreview type="image/*">
        <FileUploadItemPreviewImage />
      </FileUploadItemPreview>
      <FileUploadItemPreview type=".*">{/* generic icon */}</FileUploadItemPreview>
      <FileUploadItemName />
      <FileUploadItemSizeText />
      <FileUploadItemDeleteTrigger>{/* text or icon */}</FileUploadItemDeleteTrigger>
    </FileUploadItem>
  </FileUploadItemGroup>
  <FileUploadClearTrigger>{/* text or icon */}</FileUploadClearTrigger>
  <FileUploadHiddenInput />
</FileUpload>
```

## Examples

### Basic, tracking accepted files yourself

```tsx
import { createSignal } from "solid-js";

const [files, setFiles] = createSignal<File[]>([]);

<FileUpload maxFiles={5} acceptedFiles={files()} onFileChange={(details) => setFiles(details.acceptedFiles)}>
  <FileUploadLabel>Attachments</FileUploadLabel>
  <FileUploadTrigger>Choose file(s)</FileUploadTrigger>
  <FileUploadItemGroup type="accepted">
    <For each={files()}>
      {(file) => (
        <FileUploadItem file={file}>
          <FileUploadItemName />
          <FileUploadItemDeleteTrigger>✕</FileUploadItemDeleteTrigger>
        </FileUploadItem>
      )}
    </For>
  </FileUploadItemGroup>
  <FileUploadHiddenInput />
</FileUpload>
```

### Restricted by type and size, with rejected files shown separately

```tsx
import { createSignal } from "solid-js";

const [accepted, setAccepted] = createSignal<File[]>([]);
const [rejected, setRejected] = createSignal<{ file: File; errors: string[] }[]>([]);

<FileUpload
  accept="image/png,image/jpeg"
  maxFileSize={1024 * 1024}
  acceptedFiles={accepted()}
  onFileAccept={(details) => setAccepted(details.files)}
  onFileReject={(details) => setRejected(details.files)}
>
  <FileUploadLabel>Upload Images (PNG/JPEG, max 1MB)</FileUploadLabel>
  <FileUploadDropzone>Drop your images here, or click to browse</FileUploadDropzone>
  <FileUploadItemGroup type="accepted">
    <For each={accepted()}>
      {(file) => (
        <FileUploadItem file={file}>
          <FileUploadItemPreview type="image/*">
            <FileUploadItemPreviewImage />
          </FileUploadItemPreview>
          <FileUploadItemName />
          <FileUploadItemSizeText />
          <FileUploadItemDeleteTrigger>✕</FileUploadItemDeleteTrigger>
        </FileUploadItem>
      )}
    </For>
  </FileUploadItemGroup>
  <FileUploadItemGroup type="rejected">
    <For each={rejected()}>
      {({ file }) => (
        <FileUploadItem file={file}>
          <FileUploadItemName />
        </FileUploadItem>
      )}
    </For>
  </FileUploadItemGroup>
  <FileUploadHiddenInput />
</FileUpload>
```

### Clearing everything at once

```tsx
<FileUploadClearTrigger>Clear all</FileUploadClearTrigger>
```

### Dropzone plus an explicit browse button, without opening the picker twice

`disableClick` on the dropzone keeps its own click from firing alongside a nested `trigger`'s:

```tsx
<FileUploadDropzone disableClick>
  <FileUploadTrigger>Choose Files</FileUploadTrigger>
  Drag files here
</FileUploadDropzone>
```

## Styling hooks

Every part in the States table above shares `data-disabled`; most also carry `data-readonly` and
the `accepted`/`rejected` pair via `data-type` — the same mark, repeated on `item` and every part
nested inside it (`itemName`, `itemSizeText`, `itemPreview`, `itemPreviewImage`,
`itemDeleteTrigger`), so a skin can select at whichever granularity it needs. `root`/`dropzone`
carry `data-dragging` while a file is being dragged over them — the dropzone's own primary styling
hook. `trigger`/`clearTrigger`/`itemDeleteTrigger` are all real buttons with the usual
`:hover`/`:focus-visible`/`:active` pseudo-classes on top of their `data-*` marks.

## Accessibility

Ark documents no dedicated WAI-ARIA widget pattern or keyboard table for File Upload specifically —
`dropzone` is a clickable region wired to the native file picker, and `trigger`/`clearTrigger`/
`itemDeleteTrigger` are each ordinary buttons following the plain
[Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) (`Space`/`Enter` to activate,
`Tab` to move focus). `label` is wired to the real hidden `<input type="file">` via `htmlFor`, the
same as any native form label.
<!-- user:end -->
