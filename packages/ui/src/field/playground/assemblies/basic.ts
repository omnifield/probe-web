import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type FieldPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<FieldPart, string, Data> = {
  name: "basic",
  means: "рабочее поле из данных: обязательное, невалидное — видны и «*», и текст ошибки",
  tree: {
    node: "root",
    props: { required: true, invalid: true },
    children: [
      {
        node: "label",
        children: [
          { genus: "text", value: { path: "/label" } },
          { node: "requiredIndicator" },
        ],
      },
      { node: "input" },
      { node: "helperText", children: [{ genus: "text", value: { path: "/helperText" } }] },
      { node: "errorText", children: [{ genus: "text", value: { path: "/errorText" } }] },
    ],
  },
};
