// Perf-трейсы СТЕНДА. Внутреннее: наружу не экспортируется.
//
// Свой флаг, как у остальных модулей зоны: у стенда свои замеры (смена страницы, пересчёт
// показа), и мешать их в общий тумблер значит залить консоль чужими строками.

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_STAND_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_STAND_TRACE__";

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
    console.debug(`[probe-web-stand] ${label}${detail ? ` ${detail}` : ""} — ${ms.toFixed(2)}ms`);
  };
}
