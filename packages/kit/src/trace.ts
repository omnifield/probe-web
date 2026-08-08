// Perf-трейсы kit. ВНУТРЕННЕЕ: наружу не экспортируется и в `exports` манифеста не
// объявлено — каждый экспорт, который позовёт скелет, замораживается навсегда, поэтому
// поверхность держим ровно на трёх точках (`kb:PROBEWEB-2`).

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_KIT_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_KIT_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

/**
 * Включены ли трейсы. По умолчанию — нет, включает только явный глобальный флаг.
 *
 * Автоопределение по dev-режиму сборщика (`import.meta.env.DEV`) сознательно НЕ
 * используется: kit приезжает потребителю зависимостью, а подстановку в файлы из
 * `node_modules` Vite не делает — условие осталось бы вечно ложным, то есть трейсы были бы
 * мёртвым кодом. Проверено сборкой тестового приложения 2026-08-08.
 */
function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку в консоль.
 *
 * @param label имя замеряемого участка
 * @returns закрыть замер и напечатать длительность
 */
export function trace(label: string): () => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return () => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-kit] ${label} — ${ms.toFixed(2)}ms`);
  };
}
