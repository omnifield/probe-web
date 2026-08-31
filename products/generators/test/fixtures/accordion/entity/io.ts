// Input/output form passport for the accordion (`packages/io`).

import { z } from "@omnifield/probe-web-io";

const item = z.object({ id: z.string(), title: z.string() });

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
