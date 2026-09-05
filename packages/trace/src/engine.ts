// см. README.md / FAQ.md

function flagFor(zone: string): string {
  return `__WEB_CORE_${zone.toUpperCase()}_TRACE__`;
}

/** Проверяет тумблер зоны — тем же ключом, что заводит `createTracer`/`createNoter`. */
export function isEnabled(zone: string): boolean {
  return (globalThis as Record<string, unknown>)[flagFor(zone)] === true;
}

/** Переключает тумблер зоны — симметрична `isEnabled`, тот же ключ. */
export function setEnabled(zone: string, value: boolean): void {
  (globalThis as Record<string, unknown>)[flagFor(zone)] = value;
}

/** Заводит трейсер зоны `zone` — свой флаг `__WEB_CORE_<ZONE>_TRACE__`, свой префикс лога. */
export function createTracer(zone: string): (label: string) => () => void {
  return function trace(label: string): () => void {
    if (!isEnabled(zone)) return () => {};

    const started = performance.now();
    return () => {
      const ms = performance.now() - started;
      console.debug(`[web-core-${zone}] ${label} — ${ms.toFixed(2)}ms`);
    };
  };
}

/** Заводит разовую пометку в лог зоны `zone` — тот же флаг, что и у `createTracer`, без замера. */
export function createNoter(zone: string): (message: string) => void {
  return function note(message: string): void {
    if (!isEnabled(zone)) return;
    console.debug(`[web-core-${zone}] ${message}`);
  };
}
