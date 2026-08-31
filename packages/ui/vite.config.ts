// Сборка поставки — фабрика из зоны `build` (`defineLibraryConfig`, `PROBEWEB-4`).
//
// Три входа: корневой несёт JSX и обязан уехать двумя ветками (`solid` — непреобразованный
// JSX, `default` — разобранный `vite-plugin-solid`), подпути `./passport`/`./io` — данные,
// ветка одна (`./io` — паспорта формы компонентов, `PWEB-180` продолжение: тем же доводом, что
// у паспорта — потребителю нужны схемы, не JSX/Solid/`@kobalte/core`).
import { defineLibraryConfig } from "@omnifield/probe-web-build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts", solid: true },
    { name: "passport", source: "src/passport.ts" },
    { name: "io", source: "src/io.ts" },
  ],
});
