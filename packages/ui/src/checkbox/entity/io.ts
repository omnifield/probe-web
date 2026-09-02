import { z } from "@omnifield/probe-web-io";

export const input = z.object({ label: z.string() });

export const output = z.object({});

export type Data = z.infer<typeof input>;
