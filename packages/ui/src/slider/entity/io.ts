import { z } from "@omnifield/probe-web-io";

export const input = z.object({
  label: z.string(),
  defaultValue: z.array(z.number()),
});

export const output = z.object({});

export type Data = z.infer<typeof input>;
