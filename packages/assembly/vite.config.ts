// Сборка поставки — фабрика из зоны `build` (`defineLibraryConfig`, `PROBEWEB-4`). Корневой
// вход несёт JSX (отрисовка) и уезжает двумя ветками; подпуть `./model` — данные и правила,
// Solid внутри нет вовсе.
import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts", solid: true },
    { name: "model", source: "src/model.ts" },
  ],
});
