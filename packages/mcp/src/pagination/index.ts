const DEFAULT_LIMIT = 50;

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
