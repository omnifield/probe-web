// Design notes: ./README.md

const FLAG = "__PROBE_WEB_SKIN_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

export function trace(label: string): () => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return () => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-skin] ${label} — ${ms.toFixed(2)}ms`);
  };
}

export function note(message: string): void {
  if (!enabled()) return;
  console.debug(`[probe-web-skin] ${message}`);
}
