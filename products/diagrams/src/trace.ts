// Perf-трейсы продукта `diagrams`. ВНУТРЕННЕЕ: наружу не экспортируется.
//
// Своя копия, не импорт из `@omnifield/probe-web-ui` — та же граница пакета, что у `address.ts`.
// Форма и приём — те же, что `packages/ui/src/trace.ts` уже завела (разбор — там же): трейс
// ПАРНЫЙ (mount ↔ dispose), включается только явным глобальным флагом, ноль аллокаций на
// hot-path, когда канал выключен.

import { createUniqueId, onCleanup } from "solid-js";

const FLAG = "__PROBE_WEB_DIAGRAMS_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Отмечает жизнь ОДНОГО экземпляра примитива.
 *
 * @param node имя примитива вида `xy.axis`
 */
export function traceLife(node: string): void {
  if (!enabled()) return;

  const id = createUniqueId();
  const started = performance.now();
  console.debug(`[probe-web-diagrams] ${node} mount — ${id}`);

  onCleanup(() => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-diagrams] ${node} dispose — ${id}, жил ${ms.toFixed(2)}ms`);
  });
}
