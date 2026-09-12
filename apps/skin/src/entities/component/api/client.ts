import { createPresetsClient } from "@web-core/skin/presets";

import { PRESETS_URL } from "#/shared/api/presets";

export const presets = createPresetsClient({ url: PRESETS_URL });
