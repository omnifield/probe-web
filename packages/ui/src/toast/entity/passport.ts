import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { ToastProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [open, closed],
      variables: [
        { name: "--x", setBy: "kit" },
        { name: "--y", setBy: "kit" },
        { name: "--scale", setBy: "kit" },
        { name: "--opacity", setBy: "kit" },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<ToastProps>()({}),
});
