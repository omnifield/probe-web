import { createUniqueId, onCleanup } from "solid-js";

const FLAG = "__WEB_CORE_UI_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

export function traceLife(node: string): void {
  if (!enabled()) return;

  const id = createUniqueId();
  const started = performance.now();
  console.debug(`[web-core-ui] ${node} mount — ${id}`);

  onCleanup(() => {
    const ms = performance.now() - started;
    console.debug(`[web-core-ui] ${node} dispose — ${id}, жил ${ms.toFixed(2)}ms`);
  });
}
