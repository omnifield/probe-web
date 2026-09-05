import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";

type MenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<MenuPart> = {
  name: "basic",
  means: "плавающее меню само по себе: подписанная группа, разделитель, отмеченный пункт",
  providerProps: { defaultOpen: true },
  tree: {
    node: "positioner",
    children: [
      {
        node: "content",
        children: [
          { node: "arrow", children: [{ node: "arrowTip" }] },
          {
            node: "itemGroup",
            children: [
              { node: "itemGroupLabel", children: [{ genus: "text", value: "Файл" }] },
              { node: "item", props: { value: "rename" }, children: [{ genus: "text", value: "Переименовать" }] },
              { node: "item", props: { value: "delete" }, children: [{ genus: "text", value: "Удалить" }] },
            ],
          },
          { node: "separator" },
          {
            node: "item",
            props: { value: "notify" },
            children: [
              { node: "itemIndicator", children: [{ genus: "icon", value: "✓" }] },
              { node: "itemText", children: [{ genus: "text", value: "Уведомления" }] },
            ],
          },
        ],
      },
    ],
  },
};
