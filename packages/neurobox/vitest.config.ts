import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Браузерное окружение целиком: смоук-проба (когда появится) монтирует настоящий чат-хук в JSDOM.
// Условия `development`/`browser` обязательны — без них `solid-js/web` отдаёт серверную сборку
// (тот же довод, что у `router`/`query`/`form`/`ui`).
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [solid()],
        resolve: { conditions: ["development", "browser"] },
        test: {
          environment: "jsdom",
          include: ["test/*.test.tsx"],
        },
      },
      // Свой ConnectConnectionAdapter (src/engine/connection.ts) — framework-agnostic, никакого
      // DOM/Solid не требует, проверяется прямым моком fetch.
      {
        test: {
          environment: "node",
          include: ["test/*.test.ts"],
        },
      },
    ],
  },
});
