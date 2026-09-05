import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Браузерное окружение целиком: смоук-проба монтирует настоящий QueryClientProvider + useQuery
// в JSDOM. `module` в условиях — той же страховкой, что завела `@web-core/store`
// (`vitest.config.ts` там же, разбор — в её README): дальний вендор может публиковать dual-пакет
// по конвенции бандлеров, и без "module" резолв уходит в CJS-ветку с ВТОРОЙ копией Solid.
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [solid()],
        resolve: { conditions: ["module", "development", "browser"] },
        test: {
          environment: "jsdom",
          include: ["test/*.test.tsx"],
        },
      },
    ],
  },
});
