import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Два проекта, потому что тесты живут в разных мирах и одним конфигом не покрываются:
//   • mount — браузерный: JSDOM + JSX-трансформ + условия разрешения `development`/`browser`.
//     Без условий `solid-js/web` отдаёт СЕРВЕРНУЮ сборку и `render()` падает
//     «Client-only API called on the server side» (норма доки, фонд `solid-docs-testing`).
//   • surface — сборочный: тут запускается `pnpm pack` и читается тарбол, браузерные
//     условия здесь только мешали бы.
//
// `vite-plugin-solid` стоит в devDependencies и НЕ едет потребителю: build-инструмент в
// зависимостях рантайма — тот самый дефект, ради которого зона отделена (kb:PROBEWEB-4).
export default defineConfig({
  test: {
    // В `surface` идёт настоящий `pnpm pack` — дефолтных 5с не хватает.
    testTimeout: 180_000,
    hookTimeout: 180_000,
    projects: [
      {
        plugins: [solid()],
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "mount",
          environment: "jsdom",
          include: ["test/mount.test.tsx"],
        },
      },
      {
        test: {
          name: "surface",
          environment: "node",
          include: ["test/surface.test.ts"],
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
