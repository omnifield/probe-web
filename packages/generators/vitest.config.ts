import { defineConfig } from "vitest/config";

// Plain Node: generators read/write files and data, never touch a document —
// no browser resolution conditions needed here (same reasoning as `packages/io`).
// The glob is recursive because tests are grouped by module in subfolders
// (e.g. `test/barrel/*.test.ts`), mirroring `src/`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
