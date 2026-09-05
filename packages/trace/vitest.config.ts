import { defineConfig } from "vitest/config";

// Одно окружение на весь пакет: ни DOM, ни JSX-трансформ здесь не нужны — ядро без
// зависимостей, а Solid-плагин (`createLifeTracer`) проверяется вызовом `createRoot` из
// `solid-js`, не рендером компонента.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
