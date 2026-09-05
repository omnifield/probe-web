// Perf-трейсы службы. Форма взята у зоны `tables` (`src/filters/trace.ts`), чтобы включаться
// одинаково: замер открывается функцией и закрывается возвращённой.
//
// Тумблер здесь ДРУГОЙ, и это вынужденно: у серверного процесса нет консоли браузера, где
// удобно выставить `globalThis`, зато есть окружение — `PROBE_WEB_PRESETS_TRACE=1`.
// `globalThis.__PROBE_WEB_PRESETS_TRACE__` тоже читается: им пользуются пробы, где переменную
// окружения на один тест не выставишь.

const FLAG = "__PROBE_WEB_PRESETS_TRACE__";

function enabled() {
  if (/** @type {Record<string, unknown>} */ (globalThis)[FLAG] === true) return true;
  const env = process.env["PROBE_WEB_PRESETS_TRACE"];
  return env === "1" || env === "true";
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку.
 *
 * @param {string} label имя замеряемого участка
 * @returns {(detail?: string) => void} закрыть замер; в `detail` — что посчитали
 */
export function trace(label) {
  if (!enabled()) return () => {};

  const started = performance.now();
  return (detail) => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-presets] ${label}${detail ? ` ${detail}` : ""} — ${ms.toFixed(2)}ms`);
  };
}
