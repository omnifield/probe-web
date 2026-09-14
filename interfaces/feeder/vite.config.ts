import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [{ name: "index", source: "src/index.ts", solid: true }],
});
