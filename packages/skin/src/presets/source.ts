// Design notes: ../README.md#presets

import type { SkinSource } from "@omnifield/probe-web-runtime";

import type { PassportLookup } from "../address/index.js";
import { withPassports } from "../generate/index.js";
import { listOutfitNames, PresetsRefused, readOutfit, readParts } from "./wire.js";

export { PresetsDown, PresetsRefused } from "./wire.js";

/** Чем заводится источник. Ровно два своих: адрес службы и паспорта СВОЕГО кита. */
export interface PresetsSkinSourceOptions {
  /** Адрес службы раздачи, ДО `?kind=` — `{base}` контракта. */
  readonly url: string;
  /** Чтение паспортов кита приложения: `assemble()` без него не работает. */
  readonly lookup: PassportLookup;
}

/**
 * `SkinSource` поверх службы раздачи (`products/presets`) — приложение отдаёт адрес и паспорта
 * СВОЕГО кита, остальное (HTTP, разбор ответа, различение «легла»/«отказала», сборка наряда из
 * частей, порождение CSS) остаётся внутри и наружу не течёт: с этой стороны — обычный `SkinSource`,
 * который просто скармливается в `createSkinConnection`/`makeSkinSwitch` как есть.
 *
 * Один и тот же контракт службы (не продуктовое знание) кормит любое число приложений — у каждого
 * СВОЙ вызов со своим `url` и своим `lookup`, общего состояния между ними нет.
 *
 * @throws {PresetsDown} службы нет по названному адресу
 * @throws {PresetsRefused} служба ответила и отказала, либо у наряда изъяны (`OutfitRefused` из
 *   `assemble()` — как есть, эта фабрика её не глотает и не подменяет)
 */
export function createPresetsSkinSource(options: PresetsSkinSourceOptions): SkinSource {
  const { url, lookup } = options;
  const { assemble, generateSkinCss } = withPassports(lookup);

  return {
    names: () => listOutfitNames(url),
    css: async (name) => {
      const outfit = await readOutfit(url, name);
      if (outfit === undefined) {
        throw new PresetsRefused(`наряда «${name}» в службе раздачи нет — надевать нечего`);
      }

      return generateSkinCss(assemble(outfit, await readParts(url)).skin);
    },
  };
}
