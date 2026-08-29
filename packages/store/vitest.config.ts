import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Браузерное окружение целиком: смоук-проба монтирует настоящий компонент с `useSelector`/
// `useMachine` в JSDOM. Условия `development`/`browser` обязательны — без них `solid-js/web`
// отдаёт серверную сборку (норма доки, фонд `solid-docs-testing`, тот же довод, что у
// `runtime`/`ui`/`router`).
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [solid()],
        // `module`, а не только `development`/`browser`: `@xstate/solid` публикует dual-пакет
        // по конвенции бандлеров (ключ `module` в `exports`, отдельно от `import`), и без этого
        // условия Vite уходит на `import` — CJS-обёртку с СВОИМ `require("solid-js")`. Тот же
        // код Solid грузится ВТОРОЙ копией — предупреждение ядра «multiple instances of Solid»
        // (canon `solidJS/sources/solid-js-multiple-instances.md`) и разорванный владелец:
        // реактивность внутри `@xstate/solid` не подписывается на дерево теста (замерено
        // 2026-08-28 — без `module` тест «переключение состояния» падал молча).
        resolve: { conditions: ["module", "development", "browser"] },
        test: {
          environment: "jsdom",
          include: ["test/*.test.tsx"],
        },
      },
    ],
  },
});
