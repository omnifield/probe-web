import { defineEditorInfo } from "@web-core/skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies/index.js";
import { parts } from "./parts.js";
import { settings } from "./settings.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@web-core/ui",
  genus: "component",
  group: "layout",
  footprint: "wide",
  variantAxis: {
    means:
      "как боковые колонки связаны с шапкой и подвалом — sidebar-first (во всю высоту), " +
      "header-first (шапка/подвал во всю ширину, классический Holy Grail) или header-full " +
      "(шапка во всю ширину, подвал — только под показом, между рельсами); имя даёт человек в " +
      "редакторе, кит пропускает насквозь",
  },
  parts,
  settings,
  assemblies,
});
