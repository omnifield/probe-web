import { defineSettings, definePassport } from "@web-core/skin/model";
import type { FlowProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    {
      name: "item",
      states: [{ name: "stretch", mark: { kind: "attribute", name: "data-stretch" } }],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<FlowProps>()({}),
});
