import { z } from "@web-core/io";

const item = z.object({
  value: z.string(),
  label: z.string(),
  content: z.string(),
});

export const input = z.object({
  items: z.array(item),
});

export const output = z.object({});

export type Data = z.infer<typeof input>;
