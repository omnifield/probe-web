import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Два проекта: model (данные → текст, без документа и JSX) и kit (тот же текст, надетый на живой
// компонент). Разбор — FAQ.md.

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "model",
          environment: "node",
          include: ["test/*.test.ts"],
        },
      },
      {
        plugins: [solid()],
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "kit",
          environment: "jsdom",
          include: ["test/*.test.tsx"],
          // Всё чужое — через наш JSX-конвейер, кроме postcss (шумит про чужие source map).
          server: { deps: { inline: [/^(?!.*postcss).*$/] } },
        },
      },
    ],
  },
});
