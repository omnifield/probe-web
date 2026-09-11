
import type { SkinSource } from "../wear/switch.js";

import type { PassportLookup } from "../engine/address/index.js";
import { withPassports } from "../engine/generate/index.js";
import { createPresetsClient, PRESET_KIND } from "./client.js";
import { createLazyComponentSkin } from "./lazy.js";
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

      const palettes = await client.list(PRESET_KIND.palette);

      // Формы сюда больше не едут — компонент, вызывающий `useComponentSkin`, приносит СВОЮ форму
      // сам, лениво (`component-skin-on-demand`). `forms: []` симметрично с обеих сторон вызова —
      // тот же приём, что `checkForm`: наряд, ссылающийся РОВНО на то, что в `parts` (здесь —
      // ни на что), самосогласован, `checkOutfit` не флагует отсутствующее как изъян. Разбор,
      // включая известный пробел (компонент, не вызывающий `useComponentSkin`, — без CSS вовсе), —
      // FAQ.md.
      return generateSkinCss(
        assemble(
          { ...outfit.state, forms: [] },
          { palettes: palettes.map((record) => record.state), forms: [] },
        ).skin,
      );
    },
    components: createLazyComponentSkin({ client, lookup }),
  };
}
