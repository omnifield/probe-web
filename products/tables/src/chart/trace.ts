// Perf-трейсы модуля графика. ВНУТРЕННЕЕ: наружу не экспортируется.
//
// Свой флаг, как у фильтров и таблицы: зона отлаживается по частям, и общий тумблер залил бы
// консоль чужими строками. Форма — та же, что у кита (`packages/runtime/src/trace.ts`).

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_CHART_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_CHART_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку в консоль.
 *
 * @param label имя замеряемого участка
 * @returns закрыть замер; в `detail` — что посчитали
 */
export function trace(label: string): (detail?: string) => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return (detail?: string) => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-chart] ${label}${detail ? ` ${detail}` : ""} — ${ms.toFixed(2)}ms`);
  };
}
