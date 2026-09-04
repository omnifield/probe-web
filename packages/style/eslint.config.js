import { defineConfig } from "@web-core/lint";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...defineConfig(),
];
