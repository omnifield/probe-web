import { defineConfig } from "vitest/config";

// Чистый Node: реестр и преобразования данных не рисуют и документа не касаются — браузерных
// условий разрешения здесь не нужно (тот же довод, что у `products/mcp`).
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/*.test.ts"],
  },
});
