// Память выбора скина между заходами. Внутреннее.

import type { SkinMode } from "./switch.js";

/** `skin: null` — снят намеренно; отсутствие поля — про скин ничего не записано. */
export interface Remembered {
  skin?: string | null;
  mode?: SkinMode;
}

export const DEFAULT_STORAGE_KEY = "web-core:skin";

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function asMode(value: unknown): SkinMode | null {
  return value === "light" || value === "dark" ? value : null;
}

/** Запомненный выбор. Ничего не запомнено, хранилище недоступно, запись битая — `null`. */
export function recall(key: string): Remembered | null {
  const store = storage();
  if (!store) return null;

  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const record = parsed as { mode?: unknown; skin?: unknown };
  const kept: Remembered = {};

  const mode = asMode(record.mode);
  if (mode !== null) kept.mode = mode;

  if (record.skin === null) kept.skin = null;
  else if (typeof record.skin === "string" && record.skin !== "") kept.skin = record.skin;

  return kept;
}

/** Запоминает названные поля слиянием, не трогая остальные. */
export function remember(key: string, patch: Remembered): void {
  const store = storage();
  if (!store) return;

  const next: Remembered = { ...(recall(key) ?? {}), ...patch };

  try {
    store.setItem(key, JSON.stringify(next));
  } catch {
    // Переполненная или запрещённая квота. Выбор не переживёт заход.
  }
}
