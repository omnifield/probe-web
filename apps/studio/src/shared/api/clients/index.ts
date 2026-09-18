import { fromEnv } from "@web-core/build/env";
import { createNeuroboxConnection } from "@web-core/neurobox";
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

// `X-User-Login` едет буквально из env, а не выдумывается на клиенте — NEUROBOX_CLIENT.md
// требует подставлять его на сервере, но у lab-стенда сервера нет: логин здесь тот же
// dev-токен на приложение, что NEUROBOX_TOKEN, не личность конкретного человека.
export const NEUROBOX_USER =
  fromEnv("NEUROBOX_USER", "VITE_NEUROBOX_USER") ?? "studio-lab";

export const neuroboxConnection = createNeuroboxConnection({
  baseUrl: fromEnv("NEUROBOX_URL", "VITE_NEUROBOX_URL"),
  token: fromEnv("NEUROBOX_TOKEN", "VITE_NEUROBOX_TOKEN") ?? "",
  userLogin: NEUROBOX_USER,
});
