import { z } from "@web-core/io";

const row = z.record(z.string(), z.unknown());

export const input = z.object({ data: z.array(row) });

export const output = z.object({ value: z.array(z.string()) });

export type Data = z.infer<typeof input>;
