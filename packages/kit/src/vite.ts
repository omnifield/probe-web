// Точка 2 замороженной поверхности — СБОРКА (`kb:PROBEWEB-2`).
//
// `vite.config.ts` лежит у потребителя классом `placed-once`. Оставить его содержательным
// значило бы заморозить версию Vite, набор плагинов и настройки сборки — то есть ровно то,
// что обязано двигаться. Поэтому конфиг целиком прячется сюда, а у потребителя остаются
// три строки: импорт, вызов, `export default`.

import type { UserConfig } from "vite";
import solid from "vite-plugin-solid";

import { trace } from "./trace.js";

/**
 * Готовый конфиг Vite для приложения на kit.
 *
 * Потребитель не знает ни про solid-плагин, ни про версию Vite: и то, и другое —
 * внутреннее дело kit и меняется без правки файлов у потребителя.
 */
export function defineConfig(): UserConfig {
  const done = trace("defineConfig");

  const config: UserConfig = {
    plugins: [solid()],
  };

  done();
  return config;
}
