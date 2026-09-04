import { createComponentInfo } from "@omnifield/probe-web-ui/component-info";
import { createPresetsClient } from "@omnifield/probe-web-skin/presets";

const PRESETS_URL =
  (import.meta.env["VITE_PRESETS_URL"] as string | undefined) ?? "http://127.0.0.1:8787/api/presets";

export const componentInfo = createComponentInfo({
  presets: createPresetsClient({ url: PRESETS_URL }),
});
