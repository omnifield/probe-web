// Solid's canon by machine — the `lint` zone's preset (`@web-core/lint`).
import { defineConfig } from "@web-core/lint/eslint";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...defineConfig(),
];
