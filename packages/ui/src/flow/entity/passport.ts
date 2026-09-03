import { defineSettings, definePassport } from "@omnifield/probe-web-skin/model";
import type { FlowProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }, { name: "item", states: [] }],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<FlowProps>()({}),
});
