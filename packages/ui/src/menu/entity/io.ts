import { z } from "@web-core/io";
import { fields } from "../../shared/data/fields.js";

const item = z.object({ ...fields.item });

export const input = z.object({ items: z.array(item) });

export const output = z.object({});

export type Data = z.infer<typeof input>;
