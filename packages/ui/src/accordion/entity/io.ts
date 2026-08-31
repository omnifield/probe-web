// Input/output form passport for the accordion (`packages/io`).

import { z } from "@omnifield/probe-web-io";

// `value`/`label`, not `id`/`title`: this nested item's only consumer is a real `listbox`
// composed into `itemContent` (`playground/assemblies/action-list.ts`) — matching the field
// names `listbox`'s/`select`'s own `entity/io.ts` already use for the same shape lets the
// assembly `bind` the whole array through as-is, no per-field rename at the call site.
const item = z.object({ value: z.string(), label: z.string() });

const section = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(item).optional(),
});

/** What the accordion's own assembly reads: `/sections` (`playground/assemblies.ts`). */
export const input = z.object({ sections: z.array(section) });

/** Expanded section ids — `value`/`onValueChange`. */
export const output = z.object({ value: z.array(z.string()) });

/** `Data` for `PassportAssembly<Part, Registry, Data>` — typed `bind`/`repeat.path`. */
export type Data = z.infer<typeof input>;
