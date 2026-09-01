import { z } from "@omnifield/probe-web-io";
import { fields } from "../../shared/data/fields.js";

export interface TreeItem {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly TreeItem[];
}

const item: z.ZodType<TreeItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    ...fields.labeled,
    children: z.array(item).optional(),
  }),
);

export const input = z.object({ items: z.array(item) });

export const output = z.object({ value: z.array(z.string()) });

export type Data = z.infer<typeof input>;
