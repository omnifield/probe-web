import { defineSettings, definePassport } from "@web-core/skin/model";
import type { GridProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }, { name: "cell", states: [] }],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<GridProps>()({}),
});
