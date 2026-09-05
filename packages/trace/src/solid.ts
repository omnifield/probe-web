// см. README.md / FAQ.md

import { createUniqueId, onCleanup, onMount, type JSX } from "solid-js";

import { isEnabled, setEnabled } from "./engine.js";

/** Заводит лайфсайкл-трейсер зоны `zone` — тот же флаг `__WEB_CORE_<ZONE>_TRACE__`, что у `createTracer`. */
export function createLifeTracer(zone: string): (node: string) => void {
  return function traceLife(node: string): void {
    if (!isEnabled(zone)) return;

    const id = createUniqueId();
    const started = performance.now();
    console.debug(`[web-core-${zone}] ${node} mount — ${id}`);

    onCleanup(() => {
      const ms = performance.now() - started;
      console.debug(`[web-core-${zone}] ${node} dispose — ${id}, жил ${ms.toFixed(2)}ms`);
    });
  };
}

export interface TraceProviderProps {
  /** Зоны, включаемые на время жизни поддерева — те же имена, что в `createTracer(zone)`. */
  zones: string[];
  children: JSX.Element;
}

/**
 * Включает трейсы перечисленных зон на время жизни поддерева — выключает при размонтировании.
 * Не контекст в духе `QueryClientProvider`: тумблер global, не React/Solid-контекст, поэтому
 * провайдер лишь двигает существующий флаг зоны, а не раздаёт клиента через дерево.
 */
export function TraceProvider(props: TraceProviderProps): JSX.Element {
  onMount(() => {
    for (const zone of props.zones) setEnabled(zone, true);
  });

  onCleanup(() => {
    for (const zone of props.zones) setEnabled(zone, false);
  });

  return props.children;
}
