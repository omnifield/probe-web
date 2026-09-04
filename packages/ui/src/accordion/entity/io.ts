import { z } from "@web-core/io";

const item = z.object({ value: z.string(), label: z.string() });

const section = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(item).optional(),
  activeValues: z.array(z.string()).optional(),
});

export const input = z.object({ sections: z.array(section) });

export const output = z.object({ value: z.array(z.string()) });

export type Data = z.infer<typeof input>;
