// Perf-трейсы зоны mcp. Форма взята у `products/presets/src/trace.js` (сервер, не браузер):
// замер открывается функцией и закрывается возвращённой. ВНУТРЕННЕЕ — наружу не экспортируется.
//
// Тумблер — окружение (`PROBE_WEB_MCP_TRACE=1`), потому что у серверного процесса нет консоли
// браузера для `globalThis`. `globalThis.__PROBE_WEB_MCP_TRACE__` тоже читается — им пользуются
// пробы, где переменную окружения на один тест не выставишь.

const FLAG = "__PROBE_WEB_MCP_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  if ((globalThis as TraceGlobal)[FLAG] === true) return true;
  const env = process.env["PROBE_WEB_MCP_TRACE"];
  return env === "1" || env === "true";
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку.
 *
 * @param label имя замеряемого участка
 * @returns закрыть замер; в `detail` — что посчитали (например, имя вызванного инструмента)
 */
export function trace(label: string): (detail?: string) => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return (detail) => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-mcp] ${label}${detail ? ` ${detail}` : ""} — ${ms.toFixed(2)}ms`);
  };
}
