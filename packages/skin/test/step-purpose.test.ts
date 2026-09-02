// Живой довод: `checkValue` ловит НЕСУЩЕСТВУЮЩУЮ ссылку, но не ловит ссылку на СУЩЕСТВУЮЩУЮ
// переменную не того класса — `color: var(--accent-9)` синтаксически валиден, ступень реально
// объявлена, только отдана заливке (`STEP_PURPOSE`, `packages/style`), а не тексту, и обещания
// контраста на ней нет (`NO_PROMISE`). Найдено на живых компонентах кита (select, listbox — прямое
// попадание в `color`) и на tree-view (`--active-color`, промежуточная переменная: ступень кладётся
// на одной части, а красит текст настоящее свойство на другой) — фикстуры ниже минимальный размер
// обоих случаев, не пересказ tree-view.

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";

import { passportLookup } from "../src/address/index.js";
import { definePassport } from "../src/passport/form/index.js";
import { checkSkin } from "../src/rules/index.js";
import type { Skin, SlotRecipe } from "../src/recipe/index.js";

const anatomy = createAnatomy("swatch-proof").parts("root");

function skinOf(recipe: SlotRecipe): Skin {
  return { name: "proof", variables: {}, recipes: { "swatch-proof": recipe } };
}

describe("checkStepPurpose ловит ступень не того класса", () => {
  it("прямое попадание: краска (color) на ступень заливки — изъян", () => {
    const passport = definePassport({
      anatomy,
      root: "root",
      parts: [{ name: "root", states: [] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    });
    const lookup = passportLookup([passport]);

    const recipe: SlotRecipe = {
      base: { root: { props: { color: "var(--accent-9)" } } },
    };

    const flaws = checkSkin(skinOf(recipe), lookup);
    expect(flaws.some((flaw) => flaw.name === "step-purpose-mismatch")).toBe(true);
  });

  it("прямое попадание: краска (color) на ступень краски — норма", () => {
    const passport = definePassport({
      anatomy,
      root: "root",
      parts: [{ name: "root", states: [] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    });
    const lookup = passportLookup([passport]);

    const recipe: SlotRecipe = {
      base: { root: { props: { color: "var(--accent-11)" } } },
    };

    const flaws = checkSkin(skinOf(recipe), lookup);
    expect(flaws.filter((flaw) => flaw.name === "step-purpose-mismatch")).toEqual([]);
  });

  it("заливка (backgroundColor) на ступень заливки — норма, на ступень краски — изъян", () => {
    const passport = definePassport({
      anatomy,
      root: "root",
      parts: [{ name: "root", states: [] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    });
    const lookup = passportLookup([passport]);

    const ok = checkSkin(
      skinOf({ base: { root: { props: { backgroundColor: "var(--accent-9)" } } } }),
      lookup,
    );
    expect(ok.filter((flaw) => flaw.name === "step-purpose-mismatch")).toEqual([]);

    const bad = checkSkin(
      skinOf({ base: { root: { props: { backgroundColor: "var(--accent-11)" } } } }),
      lookup,
    );
    expect(bad.some((flaw) => flaw.name === "step-purpose-mismatch")).toBe(true);
  });

  it("косвенное попадание: ступень заливки в custom-property, объявленной паспортом как краска — изъян", () => {
    const passport = definePassport({
      anatomy,
      root: "root",
      parts: [{ name: "root", states: [], variables: [{ name: "--active-color", setBy: "kit", colorPurpose: "ink" }] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    });
    const lookup = passportLookup([passport]);

    const recipe: SlotRecipe = {
      base: { root: { props: { "--active-color": "var(--accent-9)" } } },
    };

    const flaws = checkSkin(skinOf(recipe), lookup);
    expect(flaws.some((flaw) => flaw.name === "step-purpose-mismatch")).toBe(true);
  });

  it("custom-property БЕЗ объявленного colorPurpose — не проверяется вовсе", () => {
    const passport = definePassport({
      anatomy,
      root: "root",
      parts: [{ name: "root", states: [], variables: [{ name: "--active-color", setBy: "kit" }] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    });
    const lookup = passportLookup([passport]);

    const recipe: SlotRecipe = {
      base: { root: { props: { "--active-color": "var(--accent-9)" } } },
    };

    const flaws = checkSkin(skinOf(recipe), lookup);
    expect(flaws.filter((flaw) => flaw.name === "step-purpose-mismatch")).toEqual([]);
  });

  it("свойство вне таблицы (например transform) не проверяется, даже со ступенью не своего класса", () => {
    const passport = definePassport({
      anatomy,
      root: "root",
      parts: [{ name: "root", states: [] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    });
    const lookup = passportLookup([passport]);

    const recipe: SlotRecipe = {
      base: { root: { props: { boxShadow: "0 0 0 1px var(--accent-9)" } } },
    };

    const flaws = checkSkin(skinOf(recipe), lookup);
    expect(flaws.filter((flaw) => flaw.name === "step-purpose-mismatch")).toEqual([]);
  });
});
