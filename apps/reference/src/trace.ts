// Perf-трейсы приложения. Форма та же, что в пакетах цепочки (`runtime`, `build`, `style`,
// `ui`): глобальный тумблер, замер по закрытию, `console.debug`. Одинаковая форма нужна не для
// красоты — включив три флага сразу, видно ОДНУ ленту от `mount()` до примитива, а не три
// разных формата, которые глазом не сводятся.

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_REFERENCE_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_REFERENCE_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

/**
 * Включены ли трейсы. По умолчанию — нет.
 *
 * `import.meta.env.DEV` здесь НЕ используется по той же причине, что и в рантайме: замер
 * должен включаться одинаково и в дев-сервере, и в собранном бандле, и в тестовом прогоне.
 * Условие, истинное только в одном из трёх, даёт замер, которому нельзя верить.
 */
function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку в консоль.
 *
 * @param label имя замеряемого участка
 * @returns закрыть замер и напечатать длительность
 */
export function trace(label: string): () => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return () => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-reference] ${label} — ${ms.toFixed(2)}ms`);
  };
}
