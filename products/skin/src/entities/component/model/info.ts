import { createComponentInfo } from "@web-core/ui/component-info";
import { createPresetsClient } from "@web-core/skin/presets";

const PRESETS_URL =
  (import.meta.env["VITE_PRESETS_URL"] as string | undefined) ?? "http://127.0.0.1:8787/api/presets";

export const componentInfo = createComponentInfo({
  presets: createPresetsClient({ url: PRESETS_URL }),
});
