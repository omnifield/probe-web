// Сборка поставки — фабрика из зоны `build` (`defineLibraryConfig`, `PROBEWEB-4`).
//
// Четыре входа: корневой несёт JSX и обязан уехать двумя ветками (`solid` — непреобразованный
// JSX, `default` — разобранный `vite-plugin-solid`), остальные подпути — данные, ветка одна
// (`./passport`/`./io` — паспорта кита и формы компонентов; `./component-info` — сборка обоих
// плюс службы раздачи в одну запись, `PWEB-217`): потребителю нужны схемы и функции, не
// JSX/Solid/`@kobalte/core`).
import { defineLibraryConfig } from "@omnifield/probe-web-build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts", solid: true },
    { name: "passport", source: "src/passport.ts" },
    { name: "io", source: "src/io.ts" },
    { name: "component-info", source: "src/component-info.ts" },
  ],
});
