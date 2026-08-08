// Точка 4 замороженной поверхности — ТЕСТЫ (`kb:PROBEWEB-4`).
//
// Пресет тест-раннера прячется здесь по той же причине, что и конфиг сборки: `vitest.config.ts`
// у потребителя — файл, который однажды положили и больше не трогают, а условия разрешения и
// набор плагинов обязаны двигаться за выпусками Solid.

// `vitest/config` переэкспортирует `UserConfig` из Vite под именем `ViteUserConfig` и тем же
// импортом подключает augmentation, который добавляет в него поле `test`. Берём его под
// именем контракта: в поверхности объявлено `defineTestConfig(): UserConfig`.
import type { ViteUserConfig as UserConfig } from "vitest/config";
import solid from "vite-plugin-solid";

import { trace } from "./trace.js";

/**
 * Пресет vitest для тестов на probe-web.
 *
 * Три вещи, без которых тест Solid-компонента не работает, и все три — норма доки, а не
 * предпочтение (фонд `solidJS/sources/solid-docs-testing.md`, сверено 2026-08-08):
 *
 * 1. `vite-plugin-solid` в плагинах — он и делает JSX-трансформ в раннере;
 * 2. `resolve.conditions: ["development", "browser"]` — иначе `solid-js/web` разрешится в
 *    СЕРВЕРНУЮ ветку и `render()` падает «Client-only API called on the server side»; этим же
 *    условием плагин дотягивает `solid`, по которому зависимости отдают НЕПРЕОБРАЗОВАННЫЙ JSX;
 * 3. `environment: "jsdom"` — без документа рендерить некуда. `jsdom` объявлен
 *    необязательным peer'ом: он нужен ровно тем, кто зовёт этот пресет.
 *
 * `@testing-library/jest-dom` тут намеренно не подключается: `vite-plugin-solid` подхватывает
 * его сам, если он установлен (та же дока).
 *
 * Про пункты 2 и 3 честно: `vite-plugin-solid@2.11.14` в режиме `test` подставляет и условия,
 * и jsdom САМ — проверено снятием каждого поля 2026-08-08, прогон остаётся зелёным. Оставляем
 * их явными по двум причинам: так требует дока (это норма, а не наше усмотрение), и пресет не
 * должен висеть на внутренностях плагина, которые он вправе поменять своим выпуском. Раз
 * сквозной прогон эти поля не различает, их стережёт отдельная проверка в `test/preset.test.ts`.
 *
 * @returns конфиг для `export default` в `vitest.config.ts` потребителя
 */
export function defineTestConfig(): UserConfig {
  const done = trace("defineTestConfig");

  const config: UserConfig = {
    plugins: [solid()],
    resolve: {
      conditions: ["development", "browser"],
    },
    test: {
      environment: "jsdom",
    },
  };

  done();
  return config;
}
