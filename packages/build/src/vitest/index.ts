// Точка поверхности `/vitest`. Разбор — README.md/FAQ.md пакета.
import { resolve } from "node:path";

import type { ViteUserConfig as UserConfig } from "vitest/config";
import solid from "vite-plugin-solid";

import { trace } from "../shared/trace.js";
import { findWorkspaceSources } from "../vite/workspace-source.js";

/**
 * Пресет vitest для тестов на web-core. Разбор каждого поля — README.md пакета.
 *
 * @returns конфиг для `export default` в `vitest.config.ts` потребителя
 */
export function defineTestConfig(): UserConfig {
  const done = trace("defineTestConfig");

  // Тот же машинный признак, что у дев-сервера (`/vite`, `apply: "serve"`) — иначе тесты
  // резолвят соседа через его `dist`, и «зелёные тесты» проверяют позавчерашний код соседа.
  const { aliases } = findWorkspaceSources(resolve(process.cwd()));

  const config: UserConfig = {
    plugins: [solid()],
    resolve: {
      conditions: ["development", "browser"],
      alias: aliases,
    },
    test: {
      environment: "jsdom",
      server: {
        deps: {
          // По расширению, а не списком имён — см. README.md «Почему deps.inline».
          inline: [/\.[jt]sx(\?|$)/],
        },
      },
    },
  };

  done();
  return config;
}
