import { defineConfig } from "vitest/config";

// Два проекта, потому что пробы живут в разных мирах:
//   • dom — комбинатор и реактивная обвязка: нужна браузерная ветка разрешения `solid-js`,
//     иначе приедет серверная сборка ядра;
//   • node — поставка: тут работают файловая система, `pnpm pack`, разрешение по `exports`
//     и прогон `tsc` в установке потребителя, и браузерные условия им мешают.
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["test/cn.test.ts", "test/create-style.test.ts"],
        },
      },
      {
        test: {
          name: "node",
          environment: "node",
          include: ["test/pack.test.ts", "test/types.test.ts", "test/independence.test.ts"],
          // Внутри `pack.test.ts` и `types.test.ts` поднимаются настоящие `pnpm pack` и
          // `tsc` — дефолтных 5с мало.
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
