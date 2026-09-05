// Сборка поставки — фабрика из зоны `build` (`defineLibraryConfig`, `PROBEWEB-4`). Корневой
// вход — данные и правила, Solid внутри нет вовсе. Подпуть `./render` несёт JSX и уезжает
// двумя ветками.
import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts" },
    { name: "render", source: "src/render/index.tsx", solid: true },
  ],
});
