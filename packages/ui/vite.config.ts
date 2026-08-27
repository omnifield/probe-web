// Сборка поставки — фабрика из зоны `build` (`defineLibraryConfig`, `PROBEWEB-4`).
//
// Два входа: корневой несёт JSX и обязан уехать двумя ветками (`solid` — непреобразованный
// JSX, `default` — разобранный `vite-plugin-solid`), подпуть `./passport` — данные, ветка одна.
import { defineLibraryConfig } from "@omnifield/probe-web-build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts", solid: true },
    { name: "passport", source: "src/passport.ts" },
  ],
});
