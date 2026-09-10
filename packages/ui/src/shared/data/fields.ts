import { z } from "@web-core/io";

export interface Item {
  readonly value: string;
  readonly label: string;
  readonly children?: readonly Item[];
}

const item: z.ZodType<Item> = z.lazy(() => z.object(fields.item));

export const fields = {
  labeled: { label: z.string() },
  item: {
    value: z.string(),
    label: z.string(),
    children: z.array(item).optional(),
  },
};
