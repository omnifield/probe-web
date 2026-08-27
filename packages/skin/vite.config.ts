// Сборка поставки — фабрика из зоны `build` (`defineLibraryConfig`, `PROBEWEB-4`). Четыре
// плоских входа, JSX среди них нет вовсе — механика скина не рисует, а вычисляет.
import { defineLibraryConfig } from "@omnifield/probe-web-build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts" },
    { name: "model", source: "src/model.ts" },
    { name: "flat", source: "src/flat.ts" },
    { name: "editor", source: "src/editor.ts" },
  ],
});
