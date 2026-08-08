import { defineConfig } from "vitest/config";

// Один проект и окружение `node`: пресет — конфигурация для инструмента, а не код
// приложения; браузерного мира здесь нет. Тесты поднимают настоящий ESLint (а в
// `consumer.test.ts` — ещё и настоящий `pnpm install` с CLI), поэтому дефолтных 5с мало.
export default defineConfig({
  test: {
    name: "lint",
    environment: "node",
    include: ["test/*.test.ts"],
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
});
