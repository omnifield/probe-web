import { defineSettings, definePassport } from "@omnifield/probe-web-skin/model";
import type { SurfaceProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<SurfaceProps>()({}),
});
