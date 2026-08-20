// Канон Solid, выраженный машиной, — пресет зоны `lint` (`@omnifield/probe-web-lint`).
//
// Своей отрисовки у механики скина нет: она превращает данные в текст. Пресет подключён всё
// равно — из-за проб на живом ките (`test/kit.test.tsx`): там настоящая кнопка, настоящий Solid
// и ровно тот класс ошибки с реактивностью, который пресет ловит.
//
// Пресет стоит в devDependencies — в поставку не едет.

import { defineConfig } from "@omnifield/probe-web-lint";

export default [
  {
    // Сборка и зависимости — не наш код.
    ignores: ["dist/**", "node_modules/**"],
  },
  ...defineConfig(),
];
