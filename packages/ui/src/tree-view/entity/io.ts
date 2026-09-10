import { z } from "@web-core/io";
import { fields, type Item } from "../../shared/data/fields.js";

export type { Item as TreeItem };

const item = z.object({ ...fields.item });

export const input = z.object({ items: z.array(item) });

export const output = z.object({ value: z.array(z.string()) });

export type Data = z.infer<typeof input>;
