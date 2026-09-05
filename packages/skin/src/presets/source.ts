
import type { SkinSource } from "../wear/switch.js";

import type { PassportLookup } from "../engine/address/index.js";
import { withPassports } from "../engine/generate/index.js";
import { createPresetsClient, PRESET_KIND } from "./client.js";
import { PresetsRefused } from "./wire.js";

/** Чем заводится источник: адрес службы и паспорта своего кита. */
export interface PresetsSkinSourceOptions {
  readonly url: string;
  /** Чтение паспортов кита приложения: `assemble()` без него не работает. */
  readonly lookup: PassportLookup;
}

/**
 * `SkinSource` поверх службы раздачи — обычный `SkinSource`, скармливается в
 * `createSkinConnection`/`makeSkinSwitch` как есть.
 *
 * @throws {PresetsDown} службы нет по названному адресу
 * @throws {PresetsRefused} служба отказала, либо у наряда изъяны
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
