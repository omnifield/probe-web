import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies/index.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  group: "layout",
  footprint: "regular",
  variantAxis: {
    means: "имя вариации поверхности; его даёт человек в редакторе, кит пропускает насквозь",
  },
  parts,
  assemblies,
});
