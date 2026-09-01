// Input/output form passport for the tree view (`packages/io`).

import { z } from "@omnifield/probe-web-io";

/**
 * One node — RECURSIVE: a node without `children` is a leaf, one with a non-empty array is a
 * branch. `z.lazy` is zod's own device for a type that refers to itself (`z.ZodType<TreeItem>`
 * names the shape up front, same reason a recursive interface needs its own name before it can
 * reference itself).
 */
export interface TreeItem {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly TreeItem[];
}

const item: z.ZodType<TreeItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    children: z.array(item).optional(),
  }),
);

/** What the tree view's own assemblies read: `/items` (`playground/assemblies/`). */
export const input = z.object({ items: z.array(item) });

/** Expanded node ids — `expandedValue`/`onExpandedChange`, same role accordion's own `value` plays. */
export const output = z.object({ value: z.array(z.string()) });

/** `Data` for `PassportAssembly<Part, Registry, Data>` — typed `bind`/`repeat.path`. */
export type Data = z.infer<typeof input>;
