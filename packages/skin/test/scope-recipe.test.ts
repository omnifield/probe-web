import { describe, expect, it } from "vitest";

import { scopeRecipe, type RecipeScope } from "../src/engine/recipe/scope.js";
import type { SlotRecipe } from "../src/engine/recipe/slot.js";

const RECIPE: SlotRecipe = {
  base: { root: { props: { background: "seed:surface" } } },
  defaultVariant: "primary",
  variants: {
    primary: { root: { props: { background: "seed:accent" } } },
    secondary: { root: { props: { background: "seed:muted" } } },
    tertiary: { root: { props: { background: "seed:danger" } } },
  },
  settings: {
    size: {
      sm: { root: { props: { padding: "space:1" } } },
      lg: { root: { props: { padding: "space:3" } } },
    },
  },
  compoundVariants: [
    { variants: ["primary"], states: ["hover"], style: { root: { props: { background: "seed:accent-hover" } } } },
    {
      variants: ["primary", "secondary"],
      states: ["active"],
      style: { root: { props: { background: "seed:mixed" } } },
    },
  ],
};

function scope(variants: readonly string[], settings: Readonly<Record<string, readonly string[]>> = {}): RecipeScope {
  return {
    variants: new Set(variants),
    settings: new Map(Object.entries(settings).map(([name, values]) => [name, new Set(values)])),
  };
}

describe("scopeRecipe", () => {
  it("держит base всегда, режет variants до названных значений", () => {
    const scoped = scopeRecipe(RECIPE, scope(["primary"]));

    expect(scoped.base).toBe(RECIPE.base);
    expect(Object.keys(scoped.variants ?? {})).toEqual(["primary"]);
    expect(scoped.defaultVariant).toBe("primary");
  });

  it("режет settings по (имя, значение), настройка без записи в scope пропадает целиком", () => {
    const scoped = scopeRecipe(RECIPE, scope(["primary"], { size: ["sm"] }));

    expect(scoped.settings).toEqual({ size: { sm: RECIPE.settings!.size!.sm } });
  });

  it("настройка есть в scope, но нужное значение не совпало — записи нет вовсе", () => {
    const scoped = scopeRecipe(RECIPE, scope(["primary"], { size: ["md"] }));

    expect(scoped.settings).toBeUndefined();
  });

  it("compoundVariants: печатается только когда ВСЕ его variants уже в scope", () => {
    const onlyPrimary = scopeRecipe(RECIPE, scope(["primary"]));
    expect(onlyPrimary.compoundVariants).toHaveLength(1);
    expect(onlyPrimary.compoundVariants![0]!.variants).toEqual(["primary"]);

    const both = scopeRecipe(RECIPE, scope(["primary", "secondary"]));
    expect(both.compoundVariants).toHaveLength(2);
  });

  it("рецепт без settings/compoundVariants — не рождает их из пустоты", () => {
    const bare: SlotRecipe = { base: RECIPE.base, defaultVariant: "primary", variants: { primary: RECIPE.variants!.primary! } };
    const scoped = scopeRecipe(bare, scope(["primary"]));

    expect(scoped.settings).toBeUndefined();
    expect(scoped.compoundVariants).toBeUndefined();
  });
});
