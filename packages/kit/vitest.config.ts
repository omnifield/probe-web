import { defineConfig } from "vitest/config";

// Два проекта, потому что тесты живут в разных мирах и одним конфигом не покрываются:
//   • runtime — браузерный: JSDOM + условие разрешения `browser`, иначе `solid-js/web`
//     отдаёт СЕРВЕРНУЮ сборку и `render()` падает «Client-only API called on the server side»;
//   • node — сборочный: тут поднимается настоящий Vite и `tsc`, и подмена условий на
//     браузерные сломала бы импорт самих инструментов.
export default defineConfig({
  test: {
    // Внутри тестов идёт настоящая сборка Vite и прогон tsc — дефолтных 5с не хватает.
    testTimeout: 180_000,
    hookTimeout: 180_000,
    projects: [
      {
        resolve: { conditions: ["browser", "development"] },
        test: {
          name: "runtime",
          environment: "jsdom",
          include: ["test/runtime.test.ts"],
        },
      },
      {
        test: {
          name: "node",
          environment: "node",
          include: ["test/build.test.ts", "test/surface.test.ts"],
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
