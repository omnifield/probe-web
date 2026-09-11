// Урезает рецепт до подмножества значений variant/setting. Разбор — FAQ.md
// (`component-skin-on-demand`).

import type { PartStyles } from "./local.js";
import type { CompoundVariant, SlotRecipe } from "./slot.js";

/** Какие значения осей уже накоплены для одного компонента одного наряда. */
export interface RecipeScope {
  /** Значения `variant`, включая `defaultVariant` — вызывающий обязан добавить его сам. */
  readonly variants: ReadonlySet<string>;
  /** Значения по каждой `setting` отдельно. Настройка без записи здесь — ни одно значение не видели. */
  readonly settings: ReadonlyMap<string, ReadonlySet<string>>;
}

function coveredCompound(compound: CompoundVariant, variants: ReadonlySet<string>): boolean {
  return (compound.variants ?? []).every((name) => variants.has(name));
}

function scopedSettings(
  recipe: SlotRecipe,
  scope: RecipeScope,
): Readonly<Record<string, Readonly<Record<string, PartStyles>>>> | undefined {
  const entries: [string, Readonly<Record<string, PartStyles>>][] = [];

  for (const [name, byValue] of Object.entries(recipe.settings ?? {})) {
    const wanted = scope.settings.get(name);
    if (wanted === undefined) continue;

    const filtered = Object.fromEntries(Object.entries(byValue).filter(([value]) => wanted.has(value)));
    if (Object.keys(filtered).length > 0) entries.push([name, filtered]);
  }

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/**
 * `base` остаётся всегда. `variants`/`settings`/`compoundVariants` режутся до того, что назвал
 * `scope` — компаунд печатается только когда ВСЕ его значения уже в `scope.variants` (частичный
 * компаунд — это компаунд с недостающей веткой, а не то же правило раньше срока).
 */
export function scopeRecipe(recipe: SlotRecipe, scope: RecipeScope): SlotRecipe {
  const variants =
    recipe.variants &&
    Object.fromEntries(Object.entries(recipe.variants).filter(([name]) => scope.variants.has(name)));

  return {
    ...recipe,
    variants,
    settings: scopedSettings(recipe, scope),
    compoundVariants: recipe.compoundVariants?.filter((compound) => coveredCompound(compound, scope.variants)),
  };
}
