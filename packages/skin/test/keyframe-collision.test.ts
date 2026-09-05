// Живой довод: `assemble` сводит `keyframes` всех форм наряда одним `Object.assign` (`look/assemble.ts`)
// — слияние по ИМЕНИ, молча берёт последнее. Для `component-twice` та же по духу коллизия ловится,
// для движения — нет: расхождение находится вручную, не машиной, и до сих пор молчало только потому,
// что вторая анимация с тем же именем ещё не случалась. Фикстуры ниже — минимальный размер обоих
// исходов: РАЗНЫЕ ступени под одним именем (изъян) и ОДИНАКОВЫЕ ступени под одним именем, взятые из
// общего сценария (`../src/motion/scenarios.ts`) — переиспользование, а не коллизия.

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";

import { passportLookup } from "../src/engine/address/index.js";
import { checkOutfit } from "../src/engine/look/index.js";
import type { Form, LookParts, Outfit } from "../src/engine/look/index.js";
import { GROW_SHRINK_BLOCK } from "../src/engine/motion/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";

const anatomyA = createAnatomy("collision-a").parts("root");
const anatomyB = createAnatomy("collision-b").parts("root");

const passportA = definePassport({
  anatomy: anatomyA,
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

const passportB = definePassport({
  anatomy: anatomyB,
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

const lookup = passportLookup([passportA, passportB]);

function outfitOf(forms: readonly Form[]): { outfit: Outfit; parts: LookParts } {
  return {
    outfit: { name: "proof", palette: "none", forms: forms.map((form) => form.name) },
    parts: { palettes: [], forms },
  };
}

describe("checkOutfit ловит коллизию keyframes при слиянии наряда", () => {
  it("два компонента назвали анимацию одинаково, а тела разные — изъян", () => {
    const forms: Form[] = [
      {
        name: "form-a",
        component: "collision-a",
        recipe: { base: { root: { props: {} } } },
        keyframes: { wobble: { from: { opacity: "0" }, to: { opacity: "1" } } },
      },
      {
        name: "form-b",
        component: "collision-b",
        recipe: { base: { root: { props: {} } } },
        keyframes: { wobble: { from: { opacity: "1" }, to: { opacity: "0" } } },
      },
    ];

    const { outfit, parts } = outfitOf(forms);
    const flaws = checkOutfit(outfit, parts, lookup);
    expect(flaws.some((flaw) => flaw.name === "keyframe-collision")).toBe(true);
  });

  it("два компонента взяли один и тот же готовый сценарий под тем же именем — не изъян", () => {
    const forms: Form[] = [
      {
        name: "form-a",
        component: "collision-a",
        recipe: { base: { root: { props: {} } } },
        keyframes: GROW_SHRINK_BLOCK,
      },
      {
        name: "form-b",
        component: "collision-b",
        recipe: { base: { root: { props: {} } } },
        keyframes: GROW_SHRINK_BLOCK,
      },
    ];

    const { outfit, parts } = outfitOf(forms);
    const flaws = checkOutfit(outfit, parts, lookup);
    expect(flaws.filter((flaw) => flaw.name === "keyframe-collision")).toEqual([]);
  });

  it("разные имена анимаций у разных компонентов — не изъян", () => {
    const forms: Form[] = [
      {
        name: "form-a",
        component: "collision-a",
        recipe: { base: { root: { props: {} } } },
        keyframes: { "grow-a": { from: { opacity: "0" }, to: { opacity: "1" } } },
      },
      {
        name: "form-b",
        component: "collision-b",
        recipe: { base: { root: { props: {} } } },
        keyframes: { "grow-b": { from: { opacity: "0" }, to: { opacity: "1" } } },
      },
    ];

    const { outfit, parts } = outfitOf(forms);
    const flaws = checkOutfit(outfit, parts, lookup);
    expect(flaws.filter((flaw) => flaw.name === "keyframe-collision")).toEqual([]);
  });
});
