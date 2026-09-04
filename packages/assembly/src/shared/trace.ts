// см. README.md / FAQ.md

const FLAG = "__WEB_CORE_ASSEMBLY_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

export function trace(label: string): () => void {
  if (!enabled()) return () => {};

  const started = performance.now();
  return () => {
    const ms = performance.now() - started;
    console.debug(`[web-core-assembly] ${label} — ${ms.toFixed(2)}ms`);
  };
}

export function note(message: string): void {
  if (!enabled()) return;
  console.debug(`[web-core-assembly] ${message}`);
}
