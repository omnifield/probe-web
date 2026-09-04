// Perf-трейс жизненного цикла Solid-компонента: лог на монтирование + `onCleanup` на снятие.
// Отдельный подпуть (не `./trace`): единственный, кто дёргает solid-js внутри трейсера, и это
// не должно тянуться в бандл тем, кому нужен только `createTracer`/`createNoter`.

import { createUniqueId, onCleanup } from "solid-js";

/** Заводит лайфсайкл-трейсер зоны `zone` — тот же флаг `__WEB_CORE_<ZONE>_TRACE__`, что у `createTracer`. */
export function createLifeTracer(zone: string): (node: string) => void {
  const FLAG = `__WEB_CORE_${zone.toUpperCase()}_TRACE__`;

  return function traceLife(node: string): void {
    if ((globalThis as Record<string, unknown>)[FLAG] !== true) return;

    const id = createUniqueId();
    const started = performance.now();
    console.debug(`[web-core-${zone}] ${node} mount — ${id}`);

    onCleanup(() => {
      const ms = performance.now() - started;
      console.debug(`[web-core-${zone}] ${node} dispose — ${id}, жил ${ms.toFixed(2)}ms`);
    });
  };
}
