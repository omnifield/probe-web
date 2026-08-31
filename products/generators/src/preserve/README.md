# preserve

The other two engines here (`barrel`, `scaffold`) both carry the same
discipline: generated output says "do not edit by hand" and means it — a
regeneration overwrites the whole file, in full, every time. That is
correct for data that can ALWAYS be derived again (a passport's parts, a
Zod schema) — but some content genuinely cannot be: prose a human wrote
because they know something the data does not say (why a state's mark is
unreliable, a caveat, an example). That content lives only in the file
itself, and a full overwrite would erase it the next time the same
generator runs.

`preserve` is the seam between the two: one hand-written region, bracketed
by a marker pair, survives regeneration — everything outside it is
regenerated in full as before.

## How

1. The template renders its OWN placeholder text between the markers, same
   as every other run.
2. Before writing, the caller reads whatever is CURRENTLY on disk at that
   output path (if anything).
3. `mergeMarkedRegions(freshContent, existingContent, markers)` finds the
   marker pair in the existing file, and replaces the fresh render's
   placeholder with whatever was actually there.

```ts
import { mergeMarkedRegions } from "@probe-web/generators/preserve";
import { existsSync, readFileSync } from "node:fs";

const markers = { start: "<!-- user:start -->", end: "<!-- user:end -->" };

const merged = mergeMarkedRegions(
  freshContent,
  existsSync(outputPath) ? readFileSync(outputPath, "utf8") : undefined,
  markers,
);
```

## What this deliberately does not do

- **No opinion on where the engine's generate step wires this in.** `barrel`
  and `scaffold` write in full, unconditionally — merging in a preserved
  region is the CALLER's job, done after `render` and before
  `writeGeneratedFiles`, exactly like the example above. Baking it into the
  generate step itself would force every consumer to opt into the
  filesystem-read cost even when nothing needs preserving.
- **No support for more than one marked region per file.** A second,
  independent region needs its own, differently-named marker pair and its
  own call to `mergeMarkedRegions` — this function does not scan for
  multiple pairs at once.
