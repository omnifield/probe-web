import { z } from "@omnifield/probe-web-io";

export const input = z.object({ glyph: z.string() });

export const output = z.object({});

export type Data = z.infer<typeof input>;
