import { z } from "@web-core/io";

const item = z.object({
  value: z.string(),
  label: z.string(),
});

export const input = z.object({
  label: z.string(),
  items: z.array(item),
});

export const output = z.object({
  value: z.array(z.string()),
});

export type Data = z.infer<typeof input>;
