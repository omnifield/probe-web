import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type FileUploadPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const acceptedFile = new File(["résumé contents"], "resume.pdf", { type: "application/pdf" });
const rejectedFile = new File(["oversized contents"], "video.mp4", { type: "video/mp4" });

export const basic: PassportAssembly<FileUploadPart, string, Data> = {
  name: "basic",
  means: "рабочая загрузка из данных: один принятый файл, один отклонённый, кнопки удаления кликабельны",
  tree: {
    node: "root",
    children: [
      { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
      {
        node: "dropzone",
        children: [{ node: "trigger", children: [{ genus: "text", value: "Выбрать файлы" }] }],
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
              { node: "itemSizeText", children: [{ genus: "text", value: "16 Б" }] },
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
              { node: "itemSizeText", children: [{ genus: "text", value: "превышен лимит" }] },
              { node: "itemDeleteTrigger", children: [{ genus: "text", value: "✕" }] },
            ],
          },
        ],
      },
      { node: "clearTrigger", children: [{ genus: "text", value: "Очистить всё" }] },
    ],
  },
};
