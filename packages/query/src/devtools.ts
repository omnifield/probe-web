// Отдельный подпуть, а не часть `./index` — девтулы это код ТОЛЬКО для дев-сборки (тот же
// довод, что у `@omnifield/probe-web-router/devtools`). Импорт из этого подпути приложение
// оборачивает в `import.meta.env.DEV` само.
export { SolidQueryDevtools, SolidQueryDevtoolsPanel } from "@tanstack/solid-query-devtools";
