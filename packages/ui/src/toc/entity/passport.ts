import { defineSettings, definePassport } from "@web-core/skin/model";
import type { TocProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [],
      // Означают положение и размер скользящего указателя — измеряет и пишет сама машина
      // Zag (`getRootProps`), не рецепт. Стоят на `root`, не на `indicator` — сам указатель
      // читает их через обычное CSS-наследование сверху вниз.
      variables: [
        { name: "--top", setBy: "kit" },
        { name: "--left", setBy: "kit" },
        { name: "--width", setBy: "kit" },
        { name: "--height", setBy: "kit" },
      ],
    },
    { name: "content", states: [] },
    { name: "nav", states: [] },
    { name: "title", states: [] },
    { name: "list", states: [] },
    { name: "indicator", states: [] },
    {
      name: "item",
      states: [
        { name: "active", mark: { kind: "attribute", name: "data-active" } },
        { name: "first", mark: { kind: "attribute", name: "data-first" } },
        { name: "last", mark: { kind: "attribute", name: "data-last" } },
      ],
      variables: [{ name: "--depth", setBy: "kit" }],
    },
    {
      name: "link",
      states: [{ name: "active", mark: { kind: "attribute", name: "data-active" } }],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<TocProps>()({}),
});
