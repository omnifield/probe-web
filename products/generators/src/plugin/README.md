# plugin

The public surface a product actually writes against — `barrel`, `scaffold`, `extract`, `preserve`
stay as the engines underneath, but a product's own generator script should not need to know any
of them exist. Modeled on `vite`/`webpack`: the runner owns mechanics (scanning, reading, writing,
merging preserved regions), a plugin is data plus a few functions, and a product's config file is
just a list of plugins.

```ts
import { defineConfig, hasFile, run } from "@probe-web/generators/plugin";

export default defineConfig({
  rootDir: "src",
  isEntry: hasFile("entity/passport.ts"),
  plugins: [/* ... */],
});

await run(config);
```

No product code here imports `node:fs` or `node:path` — every filesystem question a plugin has is
answered by the `EntryContext` (`context.ts`) it receives, or by `hasFile` (`predicates.ts`) at the
config's own top level, the one place still working with raw directory strings (deciding whether a
scanned folder is an entry AT ALL happens before any `EntryContext` for it exists).

## EntryContext

What a plugin gets instead of a bare path:

```ts
interface EntryContext {
  name: string;                                             // "accordion"
  path: string;                                              // absolute — escape hatch, rarely needed
  resolve(relativePath: string): string;                     // absolute path for a path relative to this entry
  has(relativePath: string): boolean;                        // does this file exist inside the entry
  read(relativePath: string): string;                        // raw text
  importModule<T>(relativePath: string, config?): Promise<T>; // real executed value, via `extract`
}
```

## Two plugin shapes, not one

Same split as `barrel` vs `scaffold`, because the two questions they answer are genuinely
different — "one file from every entry" and "one file per entry" don't share a render step, only
the scan.

- **`AggregatePlugin`** — one output `path`, `collect` sees every `EntryContext` at once. The
  plugin shape behind `barrel`.
- **`PerEntryPlugin`** — `outputFor(entry)`, `collect` sees one `EntryContext` at a time. The
  plugin shape behind `scaffold`.

A plugin is just an object satisfying one of these two shapes — `output: string` marks the
aggregate kind, `outputFor: (entry) => string` marks the per-entry kind (`isAggregatePlugin`
distinguishes them by which field is present). Nothing to import to author one beyond the type
itself; a factory function returning a plugin object (or an array of them, for a spec producing
several outputs from the same scan, e.g. `barrel`'s passport/kit/io/index today) is the expected
shape for a reusable one.

## Zones — declared, not merged by hand

`readme.mjs`'s current shape reads its own output file back off disk and calls
`mergeMarkedRegions` (`../preserve`) once per zone, after render, before write — every plugin that
wants a hand-written region has had to repeat that dance itself. Here, a plugin just names its
zones:

```ts
{
  // ...
  zones: ["passport", "notes"],
}
```

The runner does the rest: after `render`, for each declared zone, it reads whatever is currently on
disk at the output path (nothing, for a first run) and splices that zone's existing content into
the fresh render, using `<!-- gen:<zone>:start -->`/`<!-- gen:<zone>:end -->` as the marker pair.
The template just needs to render its own placeholder between those same markers — same discipline
`preserve` has always had, just no longer the plugin author's problem to invoke.

## `setup` — once per plugin, not once per entry

For a dependency a plugin needs before it can collect ANYTHING — e.g. `readme`'s
`importModule("@omnifield/probe-web-io")` to get `z` for JSON Schema conversion — not tied to any
one entry. Runs once, before that plugin's entries are collected; a plugin closes over whatever it
returns.

## `isEntry` — a plugin's own narrower view

The config's top-level `isEntry` decides what counts as an entry AT ALL. A plugin's own `isEntry`
narrows further, for outputs only some entries participate in (e.g. a data-contract file that only
entries with an `entity/io.ts` produce) — entries failing it never reach that plugin's `collect`, the
same as `barrel`'s current `.filter(existsSync(...))` inside `collect`, just promoted to where the
runner can skip the entry entirely instead of every plugin re-deriving the same filter.

## What this deliberately does not do

- **No plugin registry, no discovery.** A config's `plugins` array is exactly the plugins that
  run — nothing is auto-loaded from a folder or a package name. A shared plugin is just a function
  a product imports, same as any other module.
- **No new template engine.** `render` is still `(items) => string`; `fromTemplate`/
  `fromEntryTemplate` (`../barrel/template.ts`) still work unchanged as the usual way to fill it in.
- **No watch mode.** One `run(config)` call does one full pass — the `vite dev` half of the
  analogy is not part of this yet.
