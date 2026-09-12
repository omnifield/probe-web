// `ComponentSkinSource` поверх службы раздачи — печатает CSS ОДНОГО компонента по значению
// variant/setting, узким сетевым фетчем, без предзагрузки остальных форм наряда. Разбор — FAQ.md
// (`component-skin-on-demand`).

import type { PassportLookup } from "../engine/address/index.js";
import { withPassports } from "../engine/generate/index.js";
import type { Form, Outfit, Palette } from "../engine/look/index.js";
import { motionsIn } from "../engine/motion/index.js";
import { scopeRecipe, type Keyframes, type SkinVariables, type SlotRecipe, type StyleObject } from "../engine/recipe/index.js";
import type { ComponentSkinAxis, ComponentSkinSource } from "../wear/switch.js";
import { PRESET_KIND, type PresetRecord, type PresetsClient } from "./client.js";
import { PresetsRefused } from "./wire.js";

interface OutfitContext {
  readonly outfit: Outfit;
  readonly palette: Palette;
  /** Записи целиком (`id`/`label`/`name` службы плюс содержимое) — `outfit`/`palette` выше несут
   *  только распакованное `.state`, движку больше ничего не нужно. Наружу отдаётся через `ensure()`'s
   *  `outfit` (`outfit-data-passthrough`) — собрана ОДИН раз здесь же, не на каждый `ensure()`, чтобы
   *  вызывающий видел ТУ ЖЕ ссылку между вызовами, а не новый объект-обёртку каждый раз. */
  readonly outfitData: { readonly outfit: PresetRecord<Outfit>; readonly palette: PresetRecord<Palette> };
}

interface ComponentAccumulator {
  readonly recipe: SlotRecipe;
  readonly keyframes: Keyframes | undefined;
  /** Переменные палитры — движку нужны, чтобы ПРИЗНАТЬ ссылку на них законной (они реально на
   *  странице, напечатаны один раз базой), не печатать их здесь заново. Разбор — FAQ.md. */
  readonly variables: SkinVariables;
  readonly variants: Set<string>;
  readonly settings: Map<string, Set<string>>;
  /** Запись формы, из которой взят `recipe` — `undefined`, когда наряд не одевает компонент
   *  вовсе. Наружу отдаётся через `ensure()`'s `data` (`component-skin-data-passthrough`). */
  readonly form: PresetRecord<Form> | undefined;
}

const EMPTY_RECIPE: SlotRecipe = {};

/**
 * Кейфреймы формы объявлены на неё ЦЕЛИКОМ, не по variant/setting (`grow-inline-size`/
 * `grow-block-size` — обе стороны одной оси orientation, в одном `Form.keyframes`) — а сценарий,
 * ссылающийся на них через `animation`, лежит ВНУТРИ конкретного значения оси. Печатать имя,
 * которое сегодня не накоплено ни в одном значении, — заведомо "не применено ни одним правилом"
 * для проверки (`skinRules`), даже когда оно легитимно появится следующим `ensure()`. Разбор — FAQ.md.
 */
function keyframesUsedBy(recipe: SlotRecipe, declared: Keyframes | undefined): Keyframes | undefined {
  if (declared === undefined) return undefined;

  const used = motionsIn(recipe as unknown as StyleObject, new Set(Object.keys(declared)));
  if (used.size === 0) return undefined;

  return Object.fromEntries(Object.entries(declared).filter(([name]) => used.has(name)));
}

export interface LazyComponentSkinOptions {
  readonly client: PresetsClient;
  readonly lookup: PassportLookup;
}

/** Заводит `ComponentSkinSource`; состояние сбрасывается целиком при смене наряда. Разбор — FAQ.md. */
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

        return { outfit: outfit.state, palette: palette.state, outfitData: { outfit, palette } };
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
        // Наряд не одевает этот компонент — легитимно, не изъян. Разбор — FAQ.md.
        return {
          recipe: EMPTY_RECIPE,
          keyframes: undefined,
          variables: palette,
          variants: new Set(),
          settings: new Map(),
          form: undefined,
        };
      }

      const form = candidates.find((candidate) => candidate.name === matchedName)!;

      // Приём `checkForm` (`apps/skin/.mcp`) — самосогласованная пара, `checkOutfit`/`assemble()`
      // не тронуты. Разбор — FAQ.md.
      const scopedOutfit: Outfit = { ...outfit, forms: [matchedName] };
      const { skin } = assemble(scopedOutfit, { palettes: [palette], forms: [form.state] });

      const recipe = skin.recipes[component] ?? EMPTY_RECIPE;
      const variants = new Set<string>();
      if (recipe.defaultVariant !== undefined) variants.add(recipe.defaultVariant);

      return {
        recipe,
        keyframes: skin.keyframes,
        variables: skin.variables ?? palette,
        variants,
        settings: new Map(),
        form,
      };
    })();

    accumulators.set(component, pending);
    return pending;
  }

  async function ensure(
    outfitName: string,
    component: string,
    axis: ComponentSkinAxis,
  ): Promise<{ css: string; data?: unknown; outfit?: unknown }> {
    const acc = await accumulatorFor(outfitName, component);
    // Попадание в кеш `contextFor`, не второй сетевой фетч — `accumulatorFor` выше уже вызвала его
    // синхронно с тем же `outfitName`. Разбор — FAQ.md (`outfit-data-passthrough`).
    const ctx = await contextFor(outfitName);

    if (axis.kind === "variant") {
      if (axis.value !== undefined) acc.variants.add(axis.value);
    } else {
      const seen = acc.settings.get(axis.name) ?? new Set<string>();
      seen.add(axis.value);
      acc.settings.set(axis.name, seen);
    }

    const scoped = scopeRecipe(acc.recipe, { variants: acc.variants, settings: acc.settings });
    const css = generateComponentSkinCss({
      name: outfitName,
      recipes: { [component]: scoped },
      keyframes: keyframesUsedBy(scoped, acc.keyframes),
      variables: acc.variables,
    });
    return { css, data: acc.form, outfit: ctx.outfitData };
  }

  return { ensure };
}
