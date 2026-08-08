import { defineConfig } from "vitest/config";

// Два проекта, потому что тесты живут в разных мирах:
//   • dom — механика тем и реактивность: нужен документ (JSDOM) и браузерная ветка
//     разрешения `solid-js`, иначе приедет серверная сборка ядра;
//   • node — контракт токенов, инвариант base.css и упаковка: тут работают файловая
//     система, `pnpm pack` и разрешение по `exports`, и браузерные условия им мешают.
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "dom",
          environment: "jsdom",
          include: [
            "test/cn.test.ts",
            "test/create-style.test.ts",
            "test/theme.test.ts",
            "test/trace.test.ts",
          ],
        },
      },
      {
        test: {
          name: "node",
          environment: "node",
          include: ["test/tokens.test.ts", "test/base-css.test.ts", "test/pack.test.ts"],
          // Внутри `pack.test.ts` поднимается настоящий `pnpm pack` — дефолтных 5с мало.
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
