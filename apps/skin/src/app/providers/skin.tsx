import { createSignal, Show, type JSX } from "solid-js";
import { createPresetsSkinSource } from "@web-core/skin/presets";
import { SkinProvider as SkinProviderBase } from "@web-core/skin/solid";
import { passportOf } from "@web-core/ui/passport";

import { PRESETS_URL } from "#/shared/api/clients";

const DEFAULT_SKIN = "omnifield";

const SKIN_SOURCE = createPresetsSkinSource({
  url: PRESETS_URL,
  lookup: passportOf,
});

// Роутер (и его лоадеры) монтируется ВНУТРИ этого провайдера — держим детей непоказанными, пока
// наряд не восстановлен (`onReady`), иначе лоадер первого захода стартует раньше скин-коннекшена
// и навсегда кэширует пустой результат (staleTime: Infinity) под своим ключом.
export function SkinProvider(props: { children?: JSX.Element }) {
  const [ready, setReady] = createSignal(false);

  return (
    <SkinProviderBase
      source={SKIN_SOURCE}
      options={{ fallback: { skin: DEFAULT_SKIN, mode: "light" } }}
      onReady={(promise) => {
        void promise.then(() => setReady(true));
      }}
    >
      <Show when={ready()}>{props.children}</Show>
    </SkinProviderBase>
  );
}
