import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Три проекта, потому что тесты живут в разных мирах и одним конфигом не покрываются:
//
//   • dom — предмет зоны: примитив рендерится в НАСТОЯЩИЙ документ и проверяется по узлу.
//     Нужны JSDOM, JSX-трансформ и условия разрешения `development`/`browser` — без них
//     `solid-js/web` отдаёт СЕРВЕРНУЮ сборку и `render()` падает «Client-only API called on
//     the server side» (норма доки, фонд `solid-testing-library`).
//   • surface — сборочный: здесь запускается настоящий `pnpm pack` и читается тарбол.
//     Браузерные условия тут только мешали бы.
//   • live — живой Chromium (`PWEB-111`): `*.live.test.ts` собирает кит через `esbuild` в
//     процессе (`test/kit-live.ts`, `собратьКит`), а у `esbuild` внутренний инвариант
//     (`new TextEncoder().encode("") instanceof Uint8Array`), который `jsdom` ломает подменой
//     глобальных классов из другого реалма. Разъехаться `dom` и `live` в одном файле НЕ МОГУТ —
//     vitest назначает окружение на файл, не на describe-блок, — поэтому живые пробы раскрытия
//     гармошки лежат в СОСЕДНЕМ файле рядом с компонентом (`src/accordion/accordion.live.test.ts`),
//     а не в `accordion.test.tsx` (разбор — в шапке `accordion.live.test.ts`).
//
// Пресет `@web-core/build/vitest` сюда НЕ подключается: он собран под ОДИН проект
// (окружение jsdom, три вещи из доки Solid), а у зоны их три с разными окружениями и
// конвейерами (см. выше) — пресет решал бы не ту задачу. `ui` вполне зависит от `build` для
// сборки (`vite.config.ts`, `defineLibraryConfig`) — это уже не табу (`PROBEWEB-4`).
//
// `@solidjs/testing-library` не берём (сверено 2026-08-08): последний выпуск 0.8.10 от
// 2024-09, и он тянет peer `@solidjs/router` — роутер в зависимостях библиотеки примитивов
// это лишний узел поставки ради `render`, который у Solid и так есть в `solid-js/web`.
// Ту же развилку и тем же решением закрыла зона `runtime`.
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [solid()],
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "dom",
          environment: "jsdom",
          // jsdom не несёт `ResizeObserver` — настоящие Zag-машины зовут его напрямую, без
          // заглушки падают раньше, чем до проверяемого поведения доходит очередь.
          setupFiles: ["test/setup-dom.ts"],
          // Три адреса: общезонные пробы — в `test/`; компонентные — в своей же папке, под
          // `test/` (`src/<имя>/test/*.test.tsx`, `PWEB-195` continuation — компоненты
          // переезжают на эту раскладку по одному). Старый плоский адрес
          // (`src/<имя>/<имя>.test.tsx`) остаётся, пока не переехали все — удаляется, когда
          // последний компонент перейдёт.
          include: ["test/*.test.tsx", "src/*/test/*.test.tsx", "src/*/*.test.tsx"],
        },
      },
      {
        test: {
          name: "surface",
          environment: "node",
          include: ["test/*.test.ts"],
          // Внутри `surface` поднимается настоящий `pnpm pack` — дефолтных 5с мало.
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
      {
        test: {
          name: "live",
          environment: "node",
          include: ["src/*/*.live.test.ts"],
          // Внутри поднимается настоящий Chromium и собирается кит через esbuild — дефолтных 5с
          // мало, тем же доводом, что у `surface`.
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
