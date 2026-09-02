import { z } from "@omnifield/probe-web-io";

const slide = z.object({ label: z.string() });

export const input = z.object({ slide1: slide, slide2: slide, slide3: slide });

export const output = z.object({});

export type Data = z.infer<typeof input>;
