// Perf-трейсы СТЕНДА. Внутреннее: в поставку не уезжает и наружу не экспортируется.
//
// Замеряется то, что ждёт человек и что может встать: разговор со службой пресетов. Остальное в
// стенде — пересчёт значений в памяти, и мерить его значит засорять консоль.
//
// СВОЙ ФЛАГ, а не общий со стендом зоны `tables`: тумблер включают, чтобы посмотреть на ОДИН
// стенд, и общий залил бы вывод чужими строками. Форма замера при этом та же — она отработана
// (`products/tables/src/playground/trace.ts`), и расходиться ей незачем.

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_SKIN_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_SKIN_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку в консоль.
 *
 * Выключенный тумблер отдаёт пустую функцию СРАЗУ, не трогая часы: замер, который никто не
 * читает, не должен ничего стоить.
 *
 * @param label имя замеряемого участка
 * @returns закрыть замер; в `detail` — что посчитали
 */
export function trace(label: string): (detail?: string) => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return (detail?: string) => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-skin] ${label}${detail ? ` ${detail}` : ""} — ${ms.toFixed(2)}ms`);
  };
}
