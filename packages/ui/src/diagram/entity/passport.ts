import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
import type { DiagramRootProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const x: PassportState = { name: "x", mark: { kind: "attribute", name: "data-orientation", value: "x" } };
const y: PassportState = { name: "y", mark: { kind: "attribute", name: "data-orientation", value: "y" } };

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "axis", states: [x, y] },
    { name: "grid", states: [x, y] },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: defineSettings<DiagramRootProps>()({}),
});
