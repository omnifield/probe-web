// Точка поверхности `/vitest` (`PROBEWEB-4`). Разбор — README.md/FAQ.md рядом.
import type { ViteUserConfig as UserConfig } from "vitest/config";
import solid from "vite-plugin-solid";

import { trace } from "../shared/trace.js";

/**
 * Пресет vitest для тестов на probe-web. Разбор каждого поля — README.md рядом.
 *
 * @returns конфиг для `export default` в `vitest.config.ts` потребителя
 */
export function defineTestConfig(): UserConfig {
  const done = trace("defineTestConfig");

  const config: UserConfig = {
    plugins: [solid()],
    resolve: {
      conditions: ["development", "browser"],
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
