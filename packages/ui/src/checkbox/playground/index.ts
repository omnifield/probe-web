import { defineEditorInfo } from "@web-core/skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies/index.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@web-core/ui",
  genus: "component",
  group: "inputs",
  footprint: "compact",
  variantAxis: {
    means: "имя вида, которое человек даёт чекбоксу в редакторе; кит просто пробрасывает его насквозь",
  },
  parts,
  assemblies,
});
