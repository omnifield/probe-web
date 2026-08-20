import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Два проекта, потому что тесты живут в разных мирах и одним конфигом не покрываются:
//
//   • dom — предмет зоны: примитив рендерится в НАСТОЯЩИЙ документ и проверяется по узлу.
//     Нужны JSDOM, JSX-трансформ и условия разрешения `development`/`browser` — без них
//     `solid-js/web` отдаёт СЕРВЕРНУЮ сборку и `render()` падает «Client-only API called on
//     the server side» (норма доки, фонд `solid-testing-library`).
//   • surface — сборочный: здесь запускается настоящий `pnpm pack` и читается тарбол.
//     Браузерные условия тут только мешали бы.
//
// Пресет `@omnifield/probe-web-build/vitest` сюда НЕ подключается намеренно: зона `ui` не
// вправе зависеть от `build` (направление зависимостей одностороннее, `kb:PROBEWEB-4`), а
// пакет собственных тестов пресетом и не пользуется — пресет для ПОТРЕБИТЕЛЯ.
//
// `@solidjs/testing-library` не берём (сверено 2026-08-08): последний выпуск 0.8.10 от
// 2024-09, и он тянет peer `@solidjs/router` — роутер в зависимостях библиотеки примитивов
// это лишний узел поставки ради `render`, который у Solid и так есть в `solid-js/web`.
// Ту же развилку и тем же решением закрыла зона `runtime`.
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [solid()],
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "dom",
          environment: "jsdom",
          // Два адреса, потому что компонент — это ПАПКА: его пробы лежат рядом с разметкой и
          // анатомией (`src/<имя>/<имя>.test.tsx`), а общезонные — в `test/`. Остальные
          // примитивы переезжают в папки волной разноса (`PWEB-7`).
          include: ["test/*.test.tsx", "src/*/*.test.tsx"],
        },
      },
      {
        test: {
          name: "surface",
          environment: "node",
          include: ["test/*.test.ts"],
          // Внутри `surface` поднимается настоящий `pnpm pack` — дефолтных 5с мало.
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
