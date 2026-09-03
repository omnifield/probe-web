import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
import type { TabsProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [focus] },
    { name: "list", states: [focus] },
    {
      name: "trigger",
      states: [
        { name: "selected", mark: { kind: "attribute", name: "data-selected" } },
        { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } },
        focus,
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "content",
      states: [{ name: "selected", mark: { kind: "attribute", name: "data-selected" } }],
    },
    {
      name: "indicator",
      states: [],
      variables: [
        { name: "--left", setBy: "kit" },
        { name: "--top", setBy: "kit" },
        { name: "--width", setBy: "kit" },
        { name: "--height", setBy: "kit" },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<TabsProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "horizontal" }, { value: "vertical" }],
      },
      byDefault: "horizontal",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  }),
});
