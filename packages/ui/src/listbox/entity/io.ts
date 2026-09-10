import { z } from "@web-core/io";
import { fields } from "../../shared/data/fields.js";

const item = z.object({ ...fields.item });

export const input = z.object({
  label: z.string(),
  items: z.array(item),
});

export const output = z.object({
  value: z.array(z.string()),
});

export type Data = z.infer<typeof input>;
