import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts" },
    { name: "solid", source: "src/solid/index.ts", solid: true },
    { name: "mcp", source: "src/mcp/index.ts" },
  ],
});
