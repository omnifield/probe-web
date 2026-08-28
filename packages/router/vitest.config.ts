import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Браузерное окружение целиком: смоук-проба монтирует настоящий RouterProvider в JSDOM и
// проверяет переход по маршруту через реальный рендер, а не разбором опций. Условия
// `development`/`browser` обязательны — без них `solid-js/web` отдаёт серверную сборку
// (норма доки, фонд `solid-docs-testing`, тот же довод, что у `runtime`/`ui`).
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
    ],
  },
});
