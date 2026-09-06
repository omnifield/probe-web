import { z } from "@web-core/io";

// `href` — готовая ссылка (`"#introduction"`), не голое `value` — bind резолвит путь один в
// один, склеивать строку с `#` внутри схемы нечем. Тот, кто даёт данные, даёт готовую ссылку.
const item = z.object({
  value: z.string(),
  depth: z.number(),
  label: z.string(),
  href: z.string(),
});

export const input = z.object({
  items: z.array(item),
});

export const output = z.object({});

export type Data = z.infer<typeof input>;
