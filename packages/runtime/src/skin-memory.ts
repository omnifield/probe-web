// Память выбора скина между заходами. ВНУТРЕННЕЕ — см. шапку `skin-root.ts`.
//
// Типы берутся из `./index.js` ТОЛЬКО как типы: `import type` стирается при эмите, поэтому
// цикла модулей во время выполнения не возникает. Публичная поверхность обязана быть объявлена
// в одном файле, иначе `dist/index.d.ts` получит реэкспорт, а он в зоне запрещён.

import type { SkinChoice, SkinMode } from "./index.js";

/**
 * Хранилище выбора. Ключ — наш, потребителю его знать не нужно, поэтому в скелет он не
 * уезжает и переименовать его можно выпуском пакета, а не правкой замороженного `main.tsx`.
 * Приложению, которому нужен свой ключ (несколько наших приложений на одном origin), его
 * называют аргументом.
 */
export const DEFAULT_STORAGE_KEY = "probe-web:skin";

/**
 * `localStorage`, если он вообще есть и доступен.
 *
 * Обращение к нему МОЖЕТ БРОСИТЬ, а не только вернуть `undefined`: приватный режим и
 * запрещённые сайту данные дают исключение прямо на чтении свойства. Память выбора — удобство;
 * ронять из-за неё запуск приложения нельзя (`kb:PROBEWEB-13`: механика — удобство, а не путь
 * к результату).
 */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Похоже ли значение на режим. Чужая строка в хранилище — не повод верить ей на слово. */
function asMode(value: unknown): SkinMode | null {
  return value === "light" || value === "dark" ? value : null;
}

/**
 * Запомненный выбор. Ничего не запомнено, хранилище недоступно, запись битая или чужая —
 * `null` по каждому полю по отдельности: половина записи лучше, чем выброшенная целиком.
 */
export function recall(key: string): { preset: string | null; mode: SkinMode | null } | null {
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

  const record = parsed as { preset?: unknown; mode?: unknown };
  return {
    preset: typeof record.preset === "string" && record.preset !== "" ? record.preset : null,
    mode: asMode(record.mode),
  };
}

/** Запоминает выбор целиком. Хранилище недоступно — молча ничего не делает. */
export function remember(key: string, choice: SkinChoice): void {
  const store = storage();
  if (!store) return;

  try {
    store.setItem(key, JSON.stringify({ preset: choice.preset, mode: choice.mode }));
  } catch {
    // Переполненная или запрещённая квота. Выбор не переживёт заход — вид останется верным.
  }
}
