import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts" },
    { name: "model", source: "src/model.ts" },
    { name: "flat", source: "src/flat/index.ts" },
    { name: "editor", source: "src/editor/index.ts" },
    { name: "presets", source: "src/presets/index.ts" },
    { name: "wear", source: "src/wear/index.ts" },
    { name: "solid", source: "src/solid/index.ts" },
  ],
});
