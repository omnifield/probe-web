import { z } from "@web-core/io";

// 50 сидело здесь раньше и оказалось мёртвым правилом: на сегодняшних наборах (28 форм, 35
// компонентов) ниже 50 не опускался НИКТО — значит default никогда не включался, и любой первый,
// необученный вызов без limit тихо отдавал всё целиком, без nextCursor. Найдено живой заявкой,
// причём дважды — сперва на list_presets, потом на list_components/list_presets(kind=X): патч
// одной ветки не читается как решение, если тот же паджинатор в соседнем вызове остаётся дырявым.
// 20 — планка НИЖЕ обоих текущих счётчиков, то есть проверяема прямо сейчас, а не только на бумаге.
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Голый z.number().int().positive() без верхней границы отдаёт в JSON Schema предельное целое
// языка (9007199254740991) — не бизнес-правило, а утечка типа. Найдено живой заявкой: это же число
// приезжает агенту в описании КАЖДОЙ ручки с пагинацией, шум ровно там, где вес и режут.
export const limitSchema = z.number().int().positive().max(MAX_LIMIT);

export interface PaginateOptions {
  readonly cursor?: string;
  readonly limit?: number;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
}

export function paginate<T>(items: readonly T[], options: PaginateOptions = {}): Page<T> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const offset = decodeCursor(options.cursor);
  const page = items.slice(offset, offset + limit);
  const nextOffset = offset + page.length;
  const nextCursor = nextOffset < items.length ? encodeCursor(nextOffset) : undefined;

  return { items: page, ...(nextCursor !== undefined ? { nextCursor } : {}) };
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const offset = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(offset) && offset >= 0 ? offset : 0;
}
