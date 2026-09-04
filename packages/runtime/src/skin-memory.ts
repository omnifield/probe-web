// Память выбора скина между заходами. ВНУТРЕННЕЕ — см. шапку `skin-root.ts`.
//
// Типы берутся из `./index.js` ТОЛЬКО как типы: `import type` стирается при эмите, поэтому
// цикла модулей во время выполнения не возникает. Публичная поверхность обязана быть объявлена
// в одном файле, иначе `dist/index.d.ts` получит реэкспорт, а он в зоне запрещён.

import type { SkinMode } from "./index.js";

/**
 * Запомненное — ПО ПОЛЯМ, и отсутствие поля значимо.
 *
 * `skin: null` — «человек снял скин», а `skin` отсутствует — «про скин ничего не записано».
 * Разница несущая: восстановление обязано уважать снятое и не надевать взамен него запасное
 * приложения, иначе снять скин между заходами оказалось бы невозможно.
 */
export interface Remembered {
  skin?: string | null;
  mode?: SkinMode;
}

/**
 * Хранилище выбора. Ключ — наш, потребителю его знать не нужно, поэтому в скелет он не
 * уезжает и переименовать его можно выпуском пакета, а не правкой замороженного `main.tsx`.
 * Приложению, которому нужен свой ключ (несколько наших приложений на одном origin), его
 * называют аргументом.
 */
export const DEFAULT_STORAGE_KEY = "web-core:skin";

/**
 * `localStorage`, если он вообще есть и доступен.
 *
 * Обращение к нему МОЖЕТ БРОСИТЬ, а не только вернуть `undefined`: приватный режим и
 * запрещённые сайту данные дают исключение прямо на чтении свойства. Память выбора — удобство;
 * ронять из-за неё запуск приложения нельзя (`PROBEWEB-13`: механика — удобство, а не путь
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
 * поле просто отсутствует: половина записи лучше, чем выброшенная целиком.
 */
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

  // Скин отличаем от «про скин не записано»: `null` в записи — это снятый скин, и поле должно
  // остаться. Отсутствие и мусор — отсутствие.
  if (record.skin === null) kept.skin = null;
  else if (typeof record.skin === "string" && record.skin !== "") kept.skin = record.skin;

  return kept;
}

/**
 * Запоминает НАЗВАННЫЕ поля, не трогая остальные.
 *
 * Слияние, а не запись целиком: запись одна на все части выбора, и пресет с режимом ставит
 * одна механика, а скин — другая. Записывай каждая свою половину целиком — вторая стиралась бы
 * при каждом чужом вызове, и выбор терялся бы молча, а не заметно.
 *
 * Хранилище недоступно — молча ничего не делает.
 */
export function remember(key: string, patch: Remembered): void {
  const store = storage();
  if (!store) return;

  const next: Remembered = { ...(recall(key) ?? {}), ...patch };

  try {
    store.setItem(key, JSON.stringify(next));
  } catch {
    // Переполненная или запрещённая квота. Выбор не переживёт заход — вид останется верным.
  }
}
