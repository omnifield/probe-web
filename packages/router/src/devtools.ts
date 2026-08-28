// Отдельный подпуть, а не часть `./index` — девтулы это код ТОЛЬКО для дев-сборки. Раздельный
// вход не даёт ему просочиться в бандл через случайный `import * as router from "…/router"` в
// продовом файле; сам импорт из этого подпути приложение обязано обернуть в
// `import.meta.env.DEV` (см. README).
export { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
