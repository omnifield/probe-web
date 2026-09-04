// Perf-трейсы зоны build. ВНУТРЕННЕЕ — не в exports манифеста. Разбор — src/shared/README.md.

/** Глобальный тумблер: `globalThis.__WEB_CORE_BUILD_TRACE__ = true`. */
const FLAG = "__WEB_CORE_BUILD_TRACE__";

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
    console.debug(`[web-core-build] ${label} — ${ms.toFixed(2)}ms`);
  };
}
