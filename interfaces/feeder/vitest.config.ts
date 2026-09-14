import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  resolve: { conditions: ["development", "browser"] },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    server: {
      deps: {
        inline: [/@ark-ui\/solid/, /@zag-js\//, /@kobalte\/core/, /lucide-solid/, /@web-core\//],
      },
    },
  },
});
