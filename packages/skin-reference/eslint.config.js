// Канон Solid, выраженный машиной, — пресет зоны `lint` (`@omnifield/probe-web-lint`).
//
// Своей отрисовки у эталона нет вовсе: он запись, а не компонент. Пресет подключён ради общей
// части канона — правил записи и импортов, — и стоит в devDependencies: в поставку не едет.

import { defineConfig } from "@omnifield/probe-web-lint";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...defineConfig(),
];
