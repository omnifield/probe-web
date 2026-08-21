import { configDefaults, defineConfig } from "vitest/config";

// Два проекта, потому что тесты живут в разных мирах:
//   • dom — механика тем: нужен документ (JSDOM) и браузерная ветка разрешения `solid-js`,
//     иначе приедет серверная сборка ядра;
//   • node — контракт токенов, инвариант base.css и упаковка: тут работают файловая
//     система, `pnpm pack`, разрешение по `exports` и прогон `tsc`
//     в установке потребителя, и браузерные условия им мешают.
//
// ПЕРЕЧИСЛЕН ТОЛЬКО DOM-СПИСОК, а node берёт ОСТАЛЬНОЕ. Раньше перечислялись оба, и это был
// файл, в который дописывает строку каждая новая проба, — то есть ровно тот общий список,
// который однажды забывают. Забыли: проба разбора цвета (`PWEB-42`) легла в папку и не
// запускалась, а прогон оставался зелёным. Гейт, который молча не сработал, хуже отсутствующего:
// отсутствующий видно.
//
// Теперь список ведётся с той стороны, где он КОРОТКИЙ и меняется редко: миру документа нужны
// три файла, всё прочее по построению уезжает в node. Новая проба попадает в прогон сама.
const DOM_TESTS = ["test/theme.test.ts", "test/trace.test.ts", "test/foreign-values.test.ts"];

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "dom",
          environment: "jsdom",
          include: DOM_TESTS,
        },
      },
      {
        test: {
          name: "node",
          environment: "node",
          include: ["test/**/*.test.ts"],
          exclude: [...configDefaults.exclude, ...DOM_TESTS],
          // Внутри `pack.test.ts` и `types.test.ts` поднимаются настоящие `pnpm pack` и
          // `tsc` — дефолтных 5с мало.
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
