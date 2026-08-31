// ПОДБОР СОВМЕСТИМЫХ ЗАПИСЕЙ (PWEB-187/189) — L0 из `codecs.ts` (форма уже совпадает),
// применённый не к одной записи, а фильтром по целой теме. НЕ адаптирует и не чинит
// несовпавшее — несовпавшая запись просто не возвращается, без сообщения об ошибке: это отбор
// среди своих заготовок (этап 1), не разбор чужой формы (это адаптер, этап 2/3, `PWEB-182..184`).

import { z } from "zod";

/** Записи темы, которые проходят `schema` КАК ЕСТЬ, — в исходном порядке. */
export function compatibleItems<Schema extends z.ZodType>(
  schema: Schema,
  items: readonly unknown[],
): z.infer<Schema>[] {
  const found: z.infer<Schema>[] = [];

  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) found.push(result.data);
  }

  return found;
}
