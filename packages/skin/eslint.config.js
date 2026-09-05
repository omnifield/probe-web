// The Solid canon, expressed by machine — the `lint` zone's preset (`@web-core/lint`).
//
// The skin mechanic has no rendering of its own: it turns data into text. The preset is wired in
// anyway — because of the live-kit tests (`test/kit.test.tsx`): a real button, real Solid, and
// exactly the class of reactivity bug the preset catches.
//
// The preset sits in devDependencies — it does not ship.

import { defineConfig } from "@web-core/lint/eslint";

export default [
  {
    // Build output and dependencies aren't our code.
    ignores: ["dist/**", "node_modules/**"],
  },
  ...defineConfig(),
];
