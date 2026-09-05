import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts" },
    { name: "model", source: "src/model.ts" },
    { name: "flat", source: "src/flat.ts" },
    { name: "editor", source: "src/editor.ts" },
    { name: "presets", source: "src/presets.ts" },
    { name: "wear", source: "src/wear.ts" },
    { name: "solid", source: "src/solid.ts" },
  ],
});
