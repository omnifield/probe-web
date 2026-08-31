// INPUT/OUTPUT form passport for the select (`PWEB-180`/`PWEB-195` continuation), RUNTIME, not
// editor prose.
//
// Here, not in `playground/`, the same watershed as `passport.ts` and the button's/listbox's own
// (`../../button/entity/io.ts`, `../../listbox/entity/io.ts`): `entity/` is the contract the
// component runs on, `playground/` is what a human sees and edits.
//
// The shape MATCHES the listbox's own (`../../listbox/entity/io.ts`), not by accident: both are a
// choice from a flat list of items, the only difference being whether it floats, and the INPUT
// shape does not depend on that. `label` is the caption; `items` is exactly what the root accepts
// now that building the `collection` stopped being the caller's job (`../components/kit.tsx`,
// `PWEB-195` continuation — the same fix as the listbox's own, applied here).
//
// `value` in the output is exactly what `onValueChange`'s `ValueChangeDetails.value` carries
// (`@zag-js/select`): an array of selected keys (`multiple` or not — one shape, different length).

import { z } from "@omnifield/probe-web-io";

/** One entry — the same shape as Ark's own `CollectionItem`, but as FLAT data, not a class. */
const item = z.object({
  value: z.string(),
  label: z.string(),
});

/** What the select expects on input: a label, an optional placeholder, and the list of items. */
export const input = z.object({
  label: z.string(),
  placeholder: z.string().optional(),
  items: z.array(item),
});

/** What the select emits on selection change — the selected items' keys, as-is. */
export const output = z.object({
  value: z.array(z.string()),
});

/** `Data` for `PassportAssembly<Part, Registry, Data>` — typed `bind`/`repeat.path`. */
export type Data = z.infer<typeof input>;
