// Схемы в `../src/tools/schemas.ts` зеркалят TS-типы движка — компилятор это уже проверил
// (`z.ZodType<T>` на каждой). Здесь — рантайм-довод: реальный вход/выход `checkOutfit`/
// `generateSkinCss`/`skinGaps` (те же фикстуры, что `keyframe-collision.test.ts`/
// `generate-component-skin-css.test.ts`) парсится схемами `toolDefinition()` без правки на месте.
// `assemble` — единственное исключение: флаг `palette-incomplete` бросает `OutfitRefused`, пока
// палитра не закрывает ВЕСЬ словарь (`VOCABULARY`, комбинаторно большой) — вместо того чтобы
// городить фикстуру-палитру на сотню ролей, выход схемы проверен на типизированном литерале
// (`Assembled` из движка — та же гарантия компилятора, что и у самой схемы).

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";
import { accessOf } from "@web-core/neurobox/tool";

import { passportLookup } from "../src/engine/address/index.js";
import { checkOutfit } from "../src/engine/look/index.js";
import type { Assembled, Form, LookParts, Outfit } from "../src/engine/look/index.js";
import { generateSkinCss } from "../src/engine/generate/index.js";
import { skinGaps } from "../src/engine/coverage/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";
import type { Skin } from "../src/engine/recipe/index.js";
import {
  assembleOutfitTool,
  checkOutfitTool,
  generateSkinCssTool,
  skinGapsTool,
} from "../src/tools/index.js";
import { AssembledSchema, LookPartsSchema, OutfitSchema } from "../src/tools/schemas.js";

const anatomy = createAnatomy("proof-tool-button").parts("root");

const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

const lookup = passportLookup([passport]);

const form: Form = {
  name: "proof-form",
  component: passport.component,
  recipe: { base: { root: { props: { background: "#fff" } } } },
};

const outfit: Outfit = { name: "proof-outfit", palette: "none", forms: [form.name] };
const parts: LookParts = { palettes: [], forms: [form] };

const skin: Skin = {
  name: "proof-outfit",
  recipes: { [passport.component]: form.recipe },
};

describe("все четыре тула помечены access: read", () => {
  it.each([
    ["check_outfit", checkOutfitTool],
    ["assemble_outfit", assembleOutfitTool],
    ["generate_skin_css", generateSkinCssTool],
    ["skin_gaps", skinGapsTool],
  ])("%s", (_name, tool) => {
    expect(accessOf(tool)).toBe("read");
  });
});

describe("check_outfit — вход/выход реального вызова проходит через схемы тула", () => {
  it("inputSchema принимает outfit+parts", () => {
    expect(() => checkOutfitTool.inputSchema.parse({ outfit, parts })).not.toThrow();
  });

  it("outputSchema принимает реальные флаги checkOutfit (неизвестная палитра — отсутствует в parts.palettes)", () => {
    const flaws = checkOutfit(outfit, parts, lookup);
    expect(flaws.some((flaw) => flaw.name === "unknown-palette")).toBe(true);
    expect(() => checkOutfitTool.outputSchema.parse(flaws)).not.toThrow();
  });
});

describe("assemble_outfit — та же вход-схема, выход сверен типизированным литералом Assembled", () => {
  it("inputSchema — тот же контракт, что у check_outfit", () => {
    expect(() => assembleOutfitTool.inputSchema.parse({ outfit, parts })).not.toThrow();
  });

  it("outputSchema принимает форму, которую реально возвращает assemble()", () => {
    const assembled: Assembled = {
      skin,
      report: { palette: "proof-palette", dressed: [passport.component], overrides: 0, overridesBy: {}, fluid: [] },
    };
    expect(() => assembleOutfitTool.outputSchema.parse(assembled)).not.toThrow();
  });
});

describe("generate_skin_css — реальный CSS проходит через outputSchema", () => {
  it("inputSchema принимает skin", () => {
    expect(() => generateSkinCssTool.inputSchema.parse({ skin })).not.toThrow();
  });

  it("outputSchema принимает реальную строку CSS", () => {
    const css = generateSkinCss(skin, lookup);
    expect(css).toContain("background: #fff");
    expect(() => generateSkinCssTool.outputSchema.parse(css)).not.toThrow();
  });
});

describe("skin_gaps — реальные пробелы проходят через outputSchema", () => {
  it("inputSchema принимает skin", () => {
    expect(() => skinGapsTool.inputSchema.parse({ skin })).not.toThrow();
  });

  it("outputSchema принимает реальный вывод skinGaps", () => {
    const gaps = skinGaps(skin, [passport]);
    expect(() => skinGapsTool.outputSchema.parse(gaps)).not.toThrow();
  });
});

describe("схемы не пропускают что попало", () => {
  it("OutfitSchema требует forms как массив строк, не что-то ещё", () => {
    expect(() => OutfitSchema.parse({ name: "x", palette: "y", forms: "not-an-array" })).toThrow();
  });

  it("LookPartsSchema требует оба поля", () => {
    expect(() => LookPartsSchema.parse({ palettes: [] })).toThrow();
  });

  it("AssembledSchema требует report целиком", () => {
    expect(() => AssembledSchema.parse({ skin })).toThrow();
  });
});
