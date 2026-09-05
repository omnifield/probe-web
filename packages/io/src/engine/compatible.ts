// см. README.md / FAQ.md — L0-фильтр по теме: не адаптирует, только отбирает совместимое.
import { z } from "zod";

/** Записи темы, которые проходят `schema` как есть — в исходном порядке. */
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
