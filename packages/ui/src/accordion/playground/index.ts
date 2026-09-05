import { defineEditorInfo } from "@web-core/skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies/index.js";
import { settings } from "./settings.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@web-core/ui",
  genus: "component",
  group: "disclosure",
  footprint: "regular",
  variantAxis: {
    means:
      "имя вида, которое человек даёт гармошке в редакторе; кит просто пробрасывает его насквозь",
  },
  parts,
  settings,
  assemblies,
});
