import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies/index.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  group: "other",
  footprint: "regular",
  variantAxis: {
    means: "имя вида, которое человек даёт области прокрутки в редакторе; кит просто пробрасывает его насквозь",
  },
  parts,
  assemblies,
});
