// Perf-трейсы зоны build. ВНУТРЕННЕЕ — не в exports манифеста. Разбор — src/shared/README.md.

/** Глобальный тумблер: `globalThis.__PROBE_WEB_BUILD_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_BUILD_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/** Открывает замер участка `label`. Возвращает функцию закрытия — она пишет строку в консоль. */
export function trace(label: string): () => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return () => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-build] ${label} — ${ms.toFixed(2)}ms`);
  };
}
