// Perf-трейсы зоны build. ВНУТРЕННЕЕ: наружу не экспортируется и в `exports` манифеста не
// объявлено — каждый экспорт, который позовёт скелет потребителя, замерзает навсегда
// (`kb:PROBEWEB-4`), поэтому поверхность держим ровно на трёх подпутях.

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_BUILD_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_BUILD_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

/**
 * Включены ли трейсы. По умолчанию — нет, включает только явный глобальный флаг.
 *
 * Автоопределение по dev-режиму сборщика (`import.meta.env.DEV`) здесь неприменимо вдвойне:
 * пакет приезжает потребителю зависимостью (в `node_modules` Vite подстановку не делает), а
 * фабрики конфига вообще исполняются в Node до старта сборки, где `import.meta.env` нет.
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
    console.debug(`[probe-web-build] ${label} — ${ms.toFixed(2)}ms`);
  };
}
