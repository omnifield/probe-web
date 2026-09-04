import { defineSettings, definePassport } from "@web-core/skin/model";
import type { CarouselProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "itemGroup", states: [{ name: "dragging", mark: { kind: "attribute", name: "data-dragging" } }] },
    { name: "item", states: [{ name: "inview", mark: { kind: "attribute", name: "data-inview" } }] },
    { name: "control", states: [] },
    {
      name: "prevTrigger",
      states: [
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "nextTrigger",
      states: [
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "indicatorGroup", states: [] },
    {
      name: "indicator",
      states: [
        { name: "current", mark: { kind: "attribute", name: "data-current" } },
        { name: "readonly", mark: { kind: "attribute", name: "data-readonly" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "autoplayTrigger",
      states: [
        { name: "pressed", mark: { kind: "attribute", name: "data-pressed" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "progressText", states: [] },
    { name: "autoplayIndicator", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<CarouselProps>()({
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
