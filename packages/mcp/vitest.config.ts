import { defineConfig } from "vitest/config";

// Чистый Node: MCP-сервер не рисует и документа не касается — браузерных условий разрешения
// (jsdom, resolve.conditions) не нужно, тот же довод, что у packages/io.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/*.test.ts"],
  },
});
