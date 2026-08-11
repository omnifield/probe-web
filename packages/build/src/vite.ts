// Точка 2 замороженной поверхности — СБОРКА (`kb:PROBEWEB-4`).
//
// `vite.config.ts` лежит у потребителя классом `placed-once`: положен один раз и больше
// никогда не обновится. Оставить его содержательным значило бы заморозить версию Vite, набор
// плагинов и настройки сборки — то есть ровно то, что обязано двигаться. Поэтому конфиг
// целиком прячется сюда, а у потребителя остаются три строки: импорт, вызов, `export default`.

import type { UserConfig } from "vite";
import solid from "vite-plugin-solid";

import { trace } from "./trace.js";

/**
 * Готовый конфиг Vite для приложения на probe-web.
 *
 * Потребитель не знает ни про solid-плагин, ни про версию Vite: и то, и другое — внутреннее
 * дело зоны `build` и меняется её выпуском, без правки файлов у потребителя.
 *
 * @returns конфиг для `export default` в `vite.config.ts` потребителя
 */
export function defineConfig(): UserConfig {
  const done = trace("defineConfig");

  const config: UserConfig = {
    plugins: [solid()],
  };

  done();
  return config;
}
