# trace

Trace for the skin mechanic — measurements the consumer opts into, not the build. Form taken from
the `runtime` and `assembly` zones for the same reason: build-mode autodetection
(`import.meta.env.DEV`) is dead here — the mechanic arrives at the consumer as a dependency, and
Vite does not substitute inside `node_modules` files.

This zone measures its own thing: generation is a recipe traversal that grows into text, and "why
does the editor stall on every color edit" is answered by measuring generation's own steps (rule
assembly · text assembly · nested unwrap), not overall frame time. Nested unwrap gets its own
measurement on purpose: it's a FOREIGN step (`postcss-nested`, `../flatten/`), and its cost needs to
be seen apart from ours.

`FLAG` — trace toggle: `globalThis.__PROBE_WEB_SKIN_TRACE__ = true`.

`trace` — opens a measurement. Returns the closing function — it's the one that prints the line. A
disabled trace returns an empty closer without touching the clock: a measurement on EVERY recipe
rule would itself become the thing it measures.

`note` — writes a trace line without measuring time — for events that have no duration: a check
refusal, a dropped empty rule, an unknown value name.
