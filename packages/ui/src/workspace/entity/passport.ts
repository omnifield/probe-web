import { defineSettings, definePassport } from "@web-core/skin/model";
import type { WorkspaceProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "header", states: [] },
    { name: "sidebar", states: [] },
    { name: "main", states: [] },
    { name: "rightbar", states: [] },
    { name: "footer", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<WorkspaceProps>()({
    outlined: {
      values: { kind: "flag" },
      byDefault: false,
      mark: { kind: "attribute", name: "data-outlined" },
    },
  }),
});
