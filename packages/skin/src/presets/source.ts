// Design notes: ../README.md#presets

import type { SkinSource } from "@omnifield/probe-web-runtime";

import type { PassportLookup } from "../address/index.js";
import { withPassports } from "../generate/index.js";
import { createPresetsClient, PRESET_KIND } from "./client.js";
import { PresetsRefused } from "./wire.js";

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
 * СВОЙ вызов со своим `url` и своим `lookup`, общего состояния между ними нет. Читает через
 * {@link createPresetsClient} — тот же клиент, которым читают и пишут все четыре вида записей.
 *
 * @throws {PresetsDown} службы нет по названному адресу
 * @throws {PresetsRefused} служба ответила и отказала, либо у наряда изъяны (`OutfitRefused` из
 *   `assemble()` — как есть, эта фабрика её не глотает и не подменяет)
 */
export function createPresetsSkinSource(options: PresetsSkinSourceOptions): SkinSource {
  const { url, lookup } = options;
  const client = createPresetsClient({ url });
  const { assemble, generateSkinCss } = withPassports(lookup);

  return {
    names: async () => (await client.list(PRESET_KIND.outfit)).map((record) => record.name),
    css: async (name) => {
      const outfit = await client.get(PRESET_KIND.outfit, name);
      if (outfit === undefined) {
        throw new PresetsRefused(`наряда «${name}» в службе раздачи нет — надевать нечего`);
      }

      const [palettes, forms] = await Promise.all([
        client.list(PRESET_KIND.palette),
        client.list(PRESET_KIND.form),
      ]);

      return generateSkinCss(
        assemble(outfit.state, {
          palettes: palettes.map((record) => record.state),
          forms: forms.map((record) => record.state),
        }).skin,
      );
    },
  };
}
