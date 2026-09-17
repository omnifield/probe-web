import { z } from "@web-core/io";

const row = z.record(z.string(), z.unknown());
const column = z.object({ accessorKey: z.string(), header: z.string() });
const sort = z.object({ columnId: z.string(), desc: z.boolean() });

export const input = z.object({
  data: z.array(row),
  columns: z.array(column),
  defaultSorting: z.array(sort).optional(),
});

export const output = z.object({ value: z.array(z.string()) });

export type Data = z.infer<typeof input>;
