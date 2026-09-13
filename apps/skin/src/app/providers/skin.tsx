import type { JSX } from "solid-js";
import { createPresetsSkinSource } from "@web-core/skin/presets";
import { SkinProvider as SkinProviderBase } from "@web-core/skin/solid";
import { passportOf } from "@web-core/ui/passport";

import { PRESETS_URL } from "#/shared/api/clients";

const DEFAULT_SKIN = "omnifield";

const SKIN_SOURCE = createPresetsSkinSource({
  url: PRESETS_URL,
  lookup: passportOf,
});

export function SkinProvider(props: { children?: JSX.Element }) {
  return (
    <SkinProviderBase
      source={SKIN_SOURCE}
      options={{ fallback: { skin: DEFAULT_SKIN, mode: "light" } }}
    >
      {props.children}
    </SkinProviderBase>
  );
}
