import { z } from "@omnifield/probe-web-io";

export const input = z.object({
  src: z.string().optional(),
  alt: z.string().optional(),
  fallback: z.string(),
});

export const output = z.object({});

export type Data = z.infer<typeof input>;
