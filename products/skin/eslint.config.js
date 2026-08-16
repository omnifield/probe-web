// Канон Solid машиной — пресет зоны `lint` (`@omnifield/probe-web-lint`).
// Подключается как потребителем: одной строкой, без правки правил. Пришлось глушить правило,
// чтобы написать обычный код, — это находка про пресет, а не повод завести здесь `rules`.
import { defineConfig } from "@omnifield/probe-web-lint";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...defineConfig(),
];
