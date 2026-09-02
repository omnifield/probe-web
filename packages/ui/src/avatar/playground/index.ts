import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies/index.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  group: "other",
  footprint: "compact",
  variantAxis: {
    means: "имя вида, которое человек даёт аватару в редакторе; кит просто пробрасывает его насквозь",
  },
  parts,
  assemblies,
});
