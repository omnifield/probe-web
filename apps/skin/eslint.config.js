// Канон Solid машиной — пресет зоны `lint` (`@web-core/lint`).
// Подключается как потребителем: одной строкой, без правки правил. Пришлось глушить правило,
// чтобы написать обычный код, — это находка про пресет, а не повод завести здесь `rules`.
import { defineConfig } from "@web-core/lint/eslint";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...defineConfig(),
];
