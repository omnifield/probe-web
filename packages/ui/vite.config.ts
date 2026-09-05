// Сборка поставки — фабрика из зоны `build` (`defineLibraryConfig`, `PROBEWEB-4`).
//
// Пять входов, ДВЕ ветки. `solid: true` — там, где на выходе настоящие Solid-компоненты и нужны
// обе ветки (`solid` — непреобразованный JSX, `default` — разобранный `vite-plugin-solid`):
// корневой (`index`) и `./component-registry` (`PWEB-220` — карта частей кита несёт реальные
// компоненты, `Registry`/`instanceOf` без неё не собрать). Остальные подпути — данные, ветка
// одна (`./passport`/`./io` — паспорта кита и формы компонентов; `./component-info` — сборка
// обоих плюс службы раздачи в одну запись, `PWEB-217`): потребителю нужны схемы и функции, не
// JSX/Solid/`@kobalte/core`.
import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts", solid: true },
    { name: "passport", source: "src/passport.ts" },
    { name: "io", source: "src/io.ts" },
    { name: "component-info", source: "src/component-info.ts" },
    { name: "component-registry", source: "src/component-registry.ts", solid: true },
  ],
});
