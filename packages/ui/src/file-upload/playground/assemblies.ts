// STRUCTURAL assembly templates for the file upload — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-127`).
//
// ONE assembly — `root` wrapping `label` + `dropzone`(`trigger`) + TWO `itemGroup`s (one accepted,
// one rejected) + `clearTrigger`. Files are REAL `File`s (`new File(...)`, the template's own
// suggested device, same category as the select's `collection`/the date picker's `DateValue`s),
// not JSON-shaped stand-ins — `FileUploadItemProps.file` genuinely needs one.
//
// TWO GROUPS, not one holding both: checked directly (`@ark-ui/solid/dist/components/file-upload/
// index.d.ts`) — `FileUploadItemBaseProps = Omit<ItemProps, 'type'>`, the Solid `Item` component
// does NOT accept a `type` prop at all (unlike the raw zag connector's own `getItemProps`); it
// reads "accepted" vs. "rejected" from its ENCLOSING `ItemGroup`'s own `type` prop instead. A
// single group with a per-item `type` (what the first draft of this file tried) silently renders
// every item as the group's own type, verified live via `RenderTree` before landing this shape.
//
// Both items use a generic icon for `itemPreview`, not `itemPreviewImage`: a real, non-image
// `File` would make Ark's own image-only guard throw (`../entity/anatomy.ts`'s own header names
// this), and a proof recipe has no business depending on the browser having decoded a real image.
//
// `root` also holds the real hidden `<input type="file">` (`{ extra: "hiddenInput" }`,
// `PWEB-152`) — the native file picker and form participation live on that exact node.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type FileUploadPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const acceptedFile = new File(["résumé contents"], "резюме.pdf", { type: "application/pdf" });
const rejectedFile = new File(["oversized contents"], "видео.mp4", { type: "video/mp4" });

export const assemblies: readonly PassportAssembly<FileUploadPart>[] = [
  {
    name: "basic",
    means: "рабочая загрузка: одно принятое, одно отклонённое, точки удаления кликабельны",
    tree: {
      part: "root",
      children: [
        { part: "label", children: [{ genus: "text", value: "Файлы" }] },
        {
          part: "dropzone",
          children: [{ part: "trigger", children: [{ genus: "text", value: "Выбрать файлы" }] }],
        },
        {
          part: "itemGroup",
          props: { type: "accepted" },
          children: [
            {
              part: "item",
              props: { file: acceptedFile },
              children: [
                { part: "itemPreview", children: [{ genus: "icon", value: "📄" }] },
                { part: "itemName", children: [{ genus: "text", value: acceptedFile.name }] },
                { part: "itemSizeText", children: [{ genus: "text", value: "16 Б" }] },
                { part: "itemDeleteTrigger", children: [{ genus: "text", value: "✕" }] },
              ],
            },
          ],
        },
        {
          part: "itemGroup",
          props: { type: "rejected" },
          children: [
            {
              part: "item",
              props: { file: rejectedFile },
              children: [
                { part: "itemPreview", children: [{ genus: "icon", value: "🎬" }] },
                { part: "itemName", children: [{ genus: "text", value: rejectedFile.name }] },
                { part: "itemSizeText", children: [{ genus: "text", value: "превышает лимит" }] },
                { part: "itemDeleteTrigger", children: [{ genus: "text", value: "✕" }] },
              ],
            },
          ],
        },
        { part: "clearTrigger", children: [{ genus: "text", value: "Очистить всё" }] },
        { extra: "hiddenInput" },
      ],
    },
  },
];
