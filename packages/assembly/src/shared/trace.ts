// ТРАССА механики — замеры, которые включает потребитель, а не сборка.
//
// Форма взята у зоны `runtime` (`packages/runtime/src/trace.ts`) и по той же причине:
// автоопределение по режиму сборщика (`import.meta.env.DEV`) здесь мертво. Механика приезжает
// потребителю зависимостью, а подстановку в файлы из `node_modules` Vite не делает — условие
// осталось бы вечно ложным, то есть трасса была бы кодом, который не выполняется никогда.
//
// Предмет замера у механики свой: сборка дерева — это отрисовка сотен узлов на каждую правку,
// и вопрос «почему редактор задумывается на перетаскивании» решается только замером по узлам,
// а не общим временем кадра.

/** Тумблер трассы: `globalThis.__WEB_CORE_ASSEMBLY_TRACE__ = true`. */
const FLAG = "__WEB_CORE_ASSEMBLY_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

/** Включена ли трасса. По умолчанию — нет, включает только явный глобальный флаг. */
function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Открывает замер. Возвращает функцию закрытия — она и пишет строку.
 *
 * Выключенная трасса возвращает пустое закрытие, не трогая часы: замер на КАЖДЫЙ узел дерева
 * сам стал бы тем, что он измеряет.
 *
 * @param label имя замеряемого участка
 * @returns закрыть замер и напечатать длительность
 */
export function trace(label: string): () => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return () => {
    const ms = performance.now() - started;
    console.debug(`[web-core-assembly] ${label} — ${ms.toFixed(2)}ms`);
  };
}

/**
 * Пишет строку трассы без замера времени — для событий, у которых нет длительности:
 * неразрешённый адрес, изъян целостности, отказ правке.
 *
 * @param message что произошло
 */
export function note(message: string): void {
  if (!enabled()) return;
  console.debug(`[web-core-assembly] ${message}`);
}
