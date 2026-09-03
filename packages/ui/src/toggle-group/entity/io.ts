import { z } from "@omnifield/probe-web-io";

const item = z.object({
  value: z.string(),
  label: z.string(),
});

export const input = z.object({
  items: z.array(item),
});

export const output = z.object({});

export type Data = z.infer<typeof input>;
