import { configDefaults, defineConfig } from "vitest/config";

const DOM_TESTS = ["test/mode.test.ts", "test/solid/**/*.test.ts"];

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
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
