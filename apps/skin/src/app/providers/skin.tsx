// Источник скина продукта — один инстанс на приложение. Заводится здесь, а не внутри `ThemeSwitch`:
// `SkinProvider` заводит по нему соединение на всё дерево, `ThemeSwitch` (`shared/ui/theme-switch`)
// только читает контекст (`useSkin()`), источником не владеет.
import type { JSX } from "solid-js";
import { createPresetsSkinSource } from "@web-core/skin/presets";
import { SkinProvider as SkinProviderBase } from "@web-core/skin/solid";
import { passportOf } from "@web-core/ui/passport";

import { PRESETS_URL } from "#/shared/api/presets";

/** Наряд, который надеваем на первом заходе, если запомненного нет — единственный сегодня в службе. */
const DEFAULT_SKIN = "omnifield";

const SKIN_SOURCE = createPresetsSkinSource({
  url: PRESETS_URL,
  lookup: passportOf,
});

export function SkinProvider(props: { children?: JSX.Element }) {
  return (
    <SkinProviderBase source={SKIN_SOURCE} options={{ fallback: { skin: DEFAULT_SKIN, mode: "light" } }}>
      {props.children}
    </SkinProviderBase>
  );
}
