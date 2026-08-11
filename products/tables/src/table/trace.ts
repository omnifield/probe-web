// Perf-трейсы модуля таблицы. ВНУТРЕННЕЕ: наружу не экспортируется.
//
// Свой файл, а не общий с фильтрами, — не небрежность: фильтры уедут отдельным продуктом, и
// зависимость от файла зоны утащила бы за ними лишнее либо порвалась бы при переезде. Форма
// та же, что у кита (`packages/runtime/src/trace.ts`), флаг — свой.

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_TABLE_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_TABLE_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку в консоль.
 *
 * @param label имя замеряемого участка
 * @returns закрыть замер; в `detail` — что посчитали (строк, колонок)
 */
export function trace(label: string): (detail?: string) => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return (detail?: string) => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-table] ${label}${detail ? ` ${detail}` : ""} — ${ms.toFixed(2)}ms`);
  };
}
