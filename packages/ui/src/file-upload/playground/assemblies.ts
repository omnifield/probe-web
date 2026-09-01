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
// The real hidden `<input type="file">` is NOT named here (постановка user, 2026-09-01, README
// «`extras` — проверка по всему киту: кейса не нашлось ни одного») — `FileUpload`'s own root
// (`../components/kit.tsx`) already renders one.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type FileUploadPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const acceptedFile = new File(["résumé contents"], "resume.pdf", { type: "application/pdf" });
const rejectedFile = new File(["oversized contents"], "video.mp4", { type: "video/mp4" });

export const assemblies: readonly PassportAssembly<FileUploadPart>[] = [
  {
    name: "basic",
    means: "a working upload: one accepted file, one rejected, delete triggers are clickable",
    tree: {
      node: "root",
      children: [
        { node: "label", children: [{ genus: "text", value: "Files" }] },
        {
          node: "dropzone",
          children: [{ node: "trigger", children: [{ genus: "text", value: "Choose files" }] }],
        },
        {
          node: "itemGroup",
          props: { type: "accepted" },
          children: [
            {
              node: "item",
              props: { file: acceptedFile },
              children: [
                { node: "itemPreview", children: [{ genus: "icon", value: "📄" }] },
                { node: "itemName", children: [{ genus: "text", value: acceptedFile.name }] },
                { node: "itemSizeText", children: [{ genus: "text", value: "16 B" }] },
                { node: "itemDeleteTrigger", children: [{ genus: "text", value: "✕" }] },
              ],
            },
          ],
        },
        {
          node: "itemGroup",
          props: { type: "rejected" },
          children: [
            {
              node: "item",
              props: { file: rejectedFile },
              children: [
                { node: "itemPreview", children: [{ genus: "icon", value: "🎬" }] },
                { node: "itemName", children: [{ genus: "text", value: rejectedFile.name }] },
                { node: "itemSizeText", children: [{ genus: "text", value: "exceeds the limit" }] },
                { node: "itemDeleteTrigger", children: [{ genus: "text", value: "✕" }] },
              ],
            },
          ],
        },
        { node: "clearTrigger", children: [{ genus: "text", value: "Clear all" }] },
      ],
    },
  },
];
