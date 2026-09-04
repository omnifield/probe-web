import { z } from "@web-core/io";

export const input = z.object({ content: z.string() });

export const output = z.object({});

export type Data = z.infer<typeof input>;
