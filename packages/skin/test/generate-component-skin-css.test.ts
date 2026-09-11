// `generateComponentSkinCss` — та же печать правил/keyframes, что `generateSkinCss`, но БЕЗ
// переменных/шрифта/ответа о половине: те печатает надевание один раз при wear(), не каждый
// компонент лениво заново (`component-skin-on-demand`, ROADMAP.yaml).

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";

import { passportLookup } from "../src/engine/address/index.js";
import { generateComponentSkinCss } from "../src/engine/generate/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";
import type { Skin } from "../src/engine/recipe/index.js";

const anatomy = createAnatomy("proof-button").parts("root");

const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

const lookup = passportLookup([passport]);

const skin: Skin = {
  name: "proof-outfit",
  recipes: {
    [passport.component]: {
      base: { root: { props: { background: "#fff" } } },
      defaultVariant: "primary",
      variants: { primary: { root: { props: { color: "#111" } } } },
    },
  },
  keyframes: { "proof-spin": { from: { opacity: "0" }, to: { opacity: "1" } } },
};

describe("generateComponentSkinCss — только правила и keyframes ОДНОГО компонента", () => {
  const css = generateComponentSkinCss(skin, lookup);

  it("несёт selector компонента и его CSS-значения", () => {
    expect(css).toContain('[data-scope="proof-button"]');
    expect(css).toContain("background: #fff");
    expect(css).toContain("color: #111");
  });

  it("несёт keyframes формы", () => {
    expect(css).toContain("@keyframes proof-spin");
  });

  it("не несёт переменных/шрифта/ответа о половине — их печатает надевание один раз, не каждый компонент", () => {
    expect(css).not.toContain(":root {");
    expect(css).not.toContain("font-family");
    expect(css).not.toContain("color-scheme");
  });
});
