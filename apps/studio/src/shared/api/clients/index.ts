import { fromEnv } from "@web-core/build/env";
import { QueryClient } from "@web-core/query";
import { createPresetsClient } from "@web-core/skin/presets";

export const queryClient = new QueryClient();

const GRAPHQL_PATH = "/graphql";
const PRESETS_LOCAL = "http://127.0.0.1:8787";

export const PRESETS_URL = (() => {
  const base = (
    fromEnv("PRESETS_URL", "VITE_PRESETS_URL") ?? PRESETS_LOCAL
  ).replace(/\/+$/, "");
  return base.endsWith(GRAPHQL_PATH) ? base : base + GRAPHQL_PATH;
})();

export const presetsClient = createPresetsClient({ url: PRESETS_URL });
