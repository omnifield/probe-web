import { defineEditorInfo } from "@web-core/skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies/index.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@web-core/ui",
  genus: "component",
  group: "other",
  footprint: "wide",
  variantAxis: {
    means: "имя вида, которое человек даёт таблице в редакторе; кит просто пробрасывает его насквозь",
  },
  parts,
  assemblies,
});
