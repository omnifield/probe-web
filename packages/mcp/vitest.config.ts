import { defineConfig } from "vitest/config";

// Чистый Node: сервер, транспорт и клиент из MCP SDK работают поверх `node:http`, браузерных
// условий разрешения здесь не нужно — в отличие от пакетов, у которых пробы держат Solid.
export default defineConfig({
  test: {
    environment: "node",
  },
});
