// Perf-трейсы модуля фильтров. ВНУТРЕННЕЕ: наружу через `../filters` не экспортируется —
// поверхность модуля объявлена и трейс в неё не входит.
//
// Форма взята у кита (`packages/runtime/src/trace.ts`), чтобы включаться одинаково: замер
// открывается функцией и закрывается возвращённой. Свой флаг, а не общий: зона отлаживается
// отдельно от рантайма, и общий тумблер залил бы консоль чужими строками.

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_TABLES_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_TABLES_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку в консоль.
 *
 * @param label имя замеряемого участка
 * @returns закрыть замер; в `detail` — что посчитали (строк на входе/выходе)
 */
export function trace(label: string): (detail?: string) => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return (detail?: string) => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-tables] ${label}${detail ? ` ${detail}` : ""} — ${ms.toFixed(2)}ms`);
  };
}
