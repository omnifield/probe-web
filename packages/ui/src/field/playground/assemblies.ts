// STRUCTURAL assembly templates for the field — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-127`).
//
// ONE assembly — `root` wrapping `label` (with `requiredIndicator` nested inside it) + `input` +
// `helperText` + `errorText`, the shape in `components/index.tsx`'s own doc-comment example.
// `required`/`invalid` are BOTH set on root so `requiredIndicator`/`errorText` — conditionally
// MOUNTED, not conditionally styled — actually exist in the tree to be dressed at all.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type FieldPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<FieldPart>[] = [
  {
    name: "basic",
    means: "рабочее поле: обязательное, с ошибкой — виден и «*», и текст ошибки",
    tree: {
      node: "root",
      props: { required: true, invalid: true },
      children: [
        {
          node: "label",
          children: [
            { genus: "text", value: "Имя" },
            { node: "requiredIndicator" },
          ],
        },
        { node: "input" },
        { node: "helperText", children: [{ genus: "text", value: "Как в паспорте" }] },
        { node: "errorText", children: [{ genus: "text", value: "Обязательное поле" }] },
      ],
    },
  },
];
