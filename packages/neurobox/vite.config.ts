import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts" },
    { name: "solid", source: "src/solid/index.ts", solid: true },
    { name: "mcp", source: "src/mcp/index.ts" },
    { name: "server", source: "src/server/index.ts" },
    { name: "pagination", source: "src/pagination/index.ts" },
    { name: "zone-feedback", source: "src/zone-feedback/index.ts" },
    { name: "tool", source: "src/tool/index.ts" },
  ],
});
