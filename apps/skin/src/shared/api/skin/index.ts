// Источник скина продукта — один инстанс на приложение. Заводится здесь, а не внутри `ThemeSwitch`:
// `SkinProvider` (`app/index.tsx`) заводит по нему соединение на всё дерево, `ThemeSwitch`
// (`shared/ui/theme-switch`) только читает контекст (`useSkin()`), источником не владеет.
import { createPresetsSkinSource } from "@web-core/skin/presets";
import { passportOf } from "@web-core/ui/passport";

import { PRESETS_URL } from "#/shared/api/presets";

/** Наряд, который надеваем на первом заходе, если запомненного нет — единственный сегодня в службе. */
export const DEFAULT_SKIN = "omnifield";

export const SKIN_SOURCE = createPresetsSkinSource({
  url: PRESETS_URL,
  lookup: passportOf,
});
