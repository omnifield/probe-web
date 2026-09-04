// Точка сборки роутинга: приложение зовёт этот подпуть из своего `vite.config.ts`, а не
// `@tanstack/router-plugin/vite` напрямую — та же логика прятанья вендора, что у
// `@web-core/build/vite` (PROBEWEB-4).
import { tanstackRouter, type Config } from "@tanstack/router-plugin/vite";
import type { Plugin } from "vite";

/** Опции генератора файловой маршрутизации — всё из `Config` вендора, кроме `target`. */
export type TanstackRouterVitePluginOptions = Partial<Omit<Config, "target">>;

/**
 * Готовый плагин файловой маршрутизации: `target: "solid"` называть не нужно,
 * `autoCodeSplitting` включён по умолчанию (рыночный дефолт TanStack — каждый маршрут своим
 * чанком без ручного `React.lazy`-аналога).
 *
 * ПОРЯДОК В МАССИВЕ ПЛАГИНОВ ОБЯЗАТЕЛЕН: этот плагин должен стоять ПЕРЕД `vite-plugin-solid`
 * (сверено, 2026-08-28) — иначе генератор не успевает разметить файлы маршрутов до того, как
 * их разберёт трансформ Solid, и падает с ошибкой порядка при `autoCodeSplitting: true`.
 *
 * `defineConfig()` зоны `build` кладёт `solid()` ПЕРВЫМ и своего расширения точки «перед» не
 * даёт (её `plugins` — это «после»), поэтому в `vite.config.ts` потребителя конфиг собирается
 * вручную:
 *
 * ```ts
 * import { defineConfig } from "@web-core/build/vite";
 * import { tanstackRouterVitePlugin } from "@web-core/router/vite";
 *
 * const config = defineConfig();
 * export default {
 *   ...config,
 *   plugins: [tanstackRouterVitePlugin(), ...(config.plugins ?? [])],
 * };
 * ```
 *
 * @param options переопределения генератора — `routesDirectory`/`generatedRouteTree` и т.п.
 */
export function tanstackRouterVitePlugin(options: TanstackRouterVitePluginOptions = {}): Plugin | Plugin[] {
  return tanstackRouter({ target: "solid", autoCodeSplitting: true, ...options });
}
