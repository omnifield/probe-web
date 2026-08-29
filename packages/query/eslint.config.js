// Solid's canon by machine — the `lint` zone's preset (`@omnifield/probe-web-lint`).
import { defineConfig } from "@omnifield/probe-web-lint";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...defineConfig(),
];
