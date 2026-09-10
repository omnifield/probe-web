import { createComponentInfo } from "@web-core/ui/component-info";
import { createPresetsClient } from "@web-core/skin/presets";

import { PRESETS_URL } from "#/shared/api/presets";

export const componentInfo = createComponentInfo({
  presets: createPresetsClient({ url: PRESETS_URL }),
});
