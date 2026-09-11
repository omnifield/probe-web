// `ComponentSkinSource` поверх службы раздачи — печатает CSS ОДНОГО компонента по значению
// variant/setting, узким сетевым фетчем, без предзагрузки остальных форм наряда. Разбор — FAQ.md
// (`component-skin-on-demand`).

import type { PassportLookup } from "../engine/address/index.js";
import { withPassports } from "../engine/generate/index.js";
import type { Outfit, Palette } from "../engine/look/index.js";
import { scopeRecipe, type Keyframes, type SlotRecipe } from "../engine/recipe/index.js";
import type { ComponentSkinAxis, ComponentSkinSource } from "../wear/switch.js";
import { PRESET_KIND, type PresetsClient } from "./client.js";
import { PresetsRefused } from "./wire.js";

interface OutfitContext {
  readonly outfit: Outfit;
  readonly palette: Palette;
}

interface ComponentAccumulator {
  readonly recipe: SlotRecipe;
  readonly keyframes: Keyframes | undefined;
  readonly variants: Set<string>;
  readonly settings: Map<string, Set<string>>;
}

const EMPTY_RECIPE: SlotRecipe = {};

export interface LazyComponentSkinOptions {
  readonly client: PresetsClient;
  readonly lookup: PassportLookup;
}

/**
 * Заводит `ComponentSkinSource`. Состояние (контекст наряда + накопленные по компоненту значения)
 * живёт в закрытом состоянии — сбрасывается целиком, когда `ensure()` видит другое имя наряда:
 * старое накопление ни разу не годится для нового наряда, второй наряд одевает форму иначе.
 */
export function createLazyComponentSkin(options: LazyComponentSkinOptions): ComponentSkinSource {
  const { client, lookup } = options;
  const { assemble, generateComponentSkinCss } = withPassports(lookup);

  let trackedOutfit: string | undefined;
  let context: Promise<OutfitContext> | undefined;
  let accumulators = new Map<string, Promise<ComponentAccumulator>>();

  function contextFor(outfitName: string): Promise<OutfitContext> {
    if (outfitName !== trackedOutfit) {
      trackedOutfit = outfitName;
      accumulators = new Map();
      context = (async (): Promise<OutfitContext> => {
        const outfit = await client.get(PRESET_KIND.outfit, outfitName);
        if (outfit === undefined) {
          throw new PresetsRefused(`наряда «${outfitName}» в службе раздачи нет — надевать нечего`);
        }

        const palettes = await client.list(PRESET_KIND.palette);
        const palette = palettes.find((record) => record.name === outfit.state.palette);
        if (palette === undefined) {
          throw new PresetsRefused(`палитры «${outfit.state.palette}» в службе раздачи нет`);
        }

        return { outfit: outfit.state, palette: palette.state };
      })();
    }

    return context!;
  }

  function accumulatorFor(outfitName: string, component: string): Promise<ComponentAccumulator> {
    const scoped = contextFor(outfitName); // синхронно решает, сбрасывать ли accumulators — до await
    let pending = accumulators.get(component);
    if (pending !== undefined) return pending;

    pending = (async (): Promise<ComponentAccumulator> => {
      const { outfit, palette } = await scoped;
      const candidates = await client.list(PRESET_KIND.form, { component: [component] });
      const matchedName = outfit.forms.find((name) => candidates.some((candidate) => candidate.name === name));

      if (matchedName === undefined) {
        // Наряд просто не одевает этот компонент — легитимно (тот же смысл, что `report.dressed`
        // у полного `assemble()`), не изъян: пустой рецепт печатает пустой лист, не бросает.
        return { recipe: EMPTY_RECIPE, keyframes: undefined, variants: new Set(), settings: new Map() };
      }

      const form = candidates.find((candidate) => candidate.name === matchedName)!;

      // Тот же приём, что `checkForm` в `apps/skin/.mcp/src/engine/validate.ts`: наряд, ссылающийся
      // РОВНО на то, что есть в `parts`, — самосогласованная пара. `checkOutfit`/`assemble()`
      // требуют полноты относительно ЭТОЙ пары, не относительно всего наряда — внутри них ничего
      // не меняется.
      const scopedOutfit: Outfit = { ...outfit, forms: [matchedName] };
      const { skin } = assemble(scopedOutfit, { palettes: [palette], forms: [form.state] });

      const recipe = skin.recipes[component] ?? EMPTY_RECIPE;
      const variants = new Set<string>();
      if (recipe.defaultVariant !== undefined) variants.add(recipe.defaultVariant);

      return { recipe, keyframes: skin.keyframes, variants, settings: new Map() };
    })();

    accumulators.set(component, pending);
    return pending;
  }

  async function ensure(outfitName: string, component: string, axis: ComponentSkinAxis): Promise<string> {
    const acc = await accumulatorFor(outfitName, component);

    if (axis.kind === "variant") {
      if (axis.value !== undefined) acc.variants.add(axis.value);
    } else {
      const seen = acc.settings.get(axis.name) ?? new Set<string>();
      seen.add(axis.value);
      acc.settings.set(axis.name, seen);
    }

    const scoped = scopeRecipe(acc.recipe, { variants: acc.variants, settings: acc.settings });
    return generateComponentSkinCss({ name: outfitName, recipes: { [component]: scoped }, keyframes: acc.keyframes });
  }

  return { ensure };
}
