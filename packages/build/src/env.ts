// Точка поверхности `/env`. Разбор — README.md/FAQ.md пакета.

/** Первое непустое значение env-ключа из перечисленных, по порядку.
 *
 *  Живёт здесь, а не в потребителе: список префиксов, которые Vite вообще проносит в бандл
 *  (`VITE_`, `PRESETS_`, `NEUROBOX_` — `envPrefix` в `defineConfig()`, `./vite/app.ts`), и способ
 *  их читать с запасным именем — одна тема, и ей лучше жить в одном месте, чем разъезжаться по
 *  копиям в каждом приложении. */
export function fromEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = import.meta.env[key] as string | undefined;
    if (value !== undefined && value.trim() !== "") return value.trim();
  }
  return undefined;
}
