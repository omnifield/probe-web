// Input/output form passport for the accordion (`packages/io`).

import { z } from "@omnifield/probe-web-io";

// `value`/`label`, not `id`/`title`: this nested item's only consumer is a real `listbox`
// composed into `content` (`playground/assemblies/action-list.ts`) — matching the field
// names `listbox`'s/`select`'s own `entity/io.ts` already use for the same shape lets the
// assembly `bind` the whole array through as-is, no per-field rename at the call site.
const item = z.object({ value: z.string(), label: z.string() });

const section = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(item).optional(),
  // The nested listbox's OWN controlled `value` (`action-list.ts`) — zero or one of THIS
  // section's item values, never more: a listbox's `value` is an array only because `multiple`
  // is a real axis for it elsewhere, not because this composition ever picks more than one.
  // Bound per section, not globally, because each section repeats its own listbox instance —
  // an uncontrolled listbox per section is what let more than one item read "checked" at once
  // across DIFFERENT sections, and what dropped the mark entirely on reload (found live,
  // 2026-08-31): nothing tied "checked" to the one fact that should decide it, which component
  // routing is actually showing.
  activeValues: z.array(z.string()).optional(),
});

/** What the accordion's own assemblies read: `/sections` (`playground/assemblies/`). */
export const input = z.object({ sections: z.array(section) });

/** Expanded section ids — `value`/`onValueChange`. */
export const output = z.object({ value: z.array(z.string()) });

/** `Data` for `PassportAssembly<Part, Registry, Data>` — typed `bind`/`repeat.path`. */
export type Data = z.infer<typeof input>;
