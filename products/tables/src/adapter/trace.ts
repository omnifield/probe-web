// Perf-трейсы адаптера. ВНУТРЕННЕЕ: наружу не экспортируется.
//
// Свой флаг, как у остальных модулей зоны: адаптер стоит на входе, и его замер нужен отдельно
// от замеров показа — иначе непонятно, что медленнее, приведение или отрисовка.

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_ADAPTER_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_ADAPTER_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку в консоль.
 *
 * @param label имя замеряемого участка
 * @returns закрыть замер; в `detail` — что посчитали (строк на входе и выходе)
 */
export function trace(label: string): (detail?: string) => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return (detail?: string) => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-adapter] ${label}${detail ? ` ${detail}` : ""} — ${ms.toFixed(2)}ms`);
  };
}
