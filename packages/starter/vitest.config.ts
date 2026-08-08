import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Только каталог проб. `template/` — это ГРУЗ, а не исходники пакета: там лежат
    // `vite.config.ts` и `main.tsx`, которые собираются у потребителя и здесь не
    // компилируются вовсе. Подобрать их сюда значило бы прогонять чужую сборку.
    include: ["test/**/*.test.ts"],
  },
});
