import { z } from "@web-core/io";

export const input = z.object({
  label: z.string(),
  "data-variant": z.string().optional(),
  payload: z.unknown().optional(),
});

export const output = z.object({
  payload: z.unknown().optional(),
});

export type Data = z.infer<typeof input>;
