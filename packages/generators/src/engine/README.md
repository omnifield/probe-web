# engine

The one public engine of this product. Modeled on `vite`/`webpack`: a runner owns mechanics
(scanning, reading, writing, merging preserved regions), a plugin is data plus a few functions, and
a product's config file is just a list of plugins — nothing a product writes needs to know how any
of that mechanics works.

```ts
import { defineConfig, hasFile, run } from "@web-core/generators/engine";

const config = defineConfig({
  rootDir: "src",
  isEntry: hasFile("entity/passport.ts"),
  plugins: [/* ... */],
});

await run(config);
```

(In practice a product does not call `run` itself — it exports `config` as the file's default
export and lets `../cli.ts` load and run it: `node .../dist/cli.js ./generators.config.ts`.)

No product code here imports `node:fs` or `node:path` for reading the entry tree — every
filesystem question a plugin has is answered by the `EntryContext` (`context.ts`) it receives, or
by `hasFile` (`predicates.ts`) at the config's own top level, the one place still working with raw
directory strings (deciding whether a scanned folder is an entry AT ALL happens before any
`EntryContext` for it exists).

## EntryContext

What a plugin gets instead of a bare path:

```ts
interface EntryContext {
  name: string;                                             // "accordion"
  path: string;                                              // absolute — escape hatch, rarely needed
  resolve(relativePath: string): string;                     // absolute path for a path relative to this entry
  has(relativePath: string): boolean;                        // does this file exist inside the entry
  read(relativePath: string): string;                        // raw text
  importModule<T>(relativePath: string, config?): Promise<T>; // real executed value, via `../extract`
}
```

## Two plugin shapes, not one

- **`AggregatePlugin`** — one output `path`, `collect` sees every `EntryContext` at once. One file
  from ALL entries — a barrel.
- **`PerEntryPlugin`** — `outputFor(entry)`, `collect` sees one `EntryContext` at a time. One file
  PER entry — e.g. a README next to each component.

These answer two genuinely different questions ("one file from every entry" vs. "one file per
entry") that don't share a render step, only the scan — same reason `Array.reduce` and
`Array.map` stay two functions, not one with a mode flag.

A plugin is just an object satisfying one of these two shapes — `output: string` marks the
aggregate kind, `outputFor: (entry) => string` marks the per-entry kind (`isAggregatePlugin`
distinguishes them by which field is present). A factory function returning a plugin object (or an
array of them, for several outputs sharing one scan — e.g. a kit's passport/kit/io/index barrels)
is the expected shape for a reusable one.

## Zones — declared, not merged by hand

A plugin that wants a hand-written region does not read its own output file back off disk and call
`mergeMarkedRegions` (`../preserve`) itself — it just names its zones:

```ts
{
  // ...
  zones: ["passport", "notes"],
}
```

The runner does the rest: after `render`, for each declared zone, it reads whatever is currently on
disk at the output path (nothing, for a first run) and splices that zone's existing content into
the fresh render, using `<!-- gen:<zone>:start -->`/`<!-- gen:<zone>:end -->` as the marker pair.
The template just needs to render its own placeholder between those same markers.

## `setup` — once per plugin, not once per entry

For a dependency a plugin needs before it can collect ANYTHING — e.g. importing a shared schema
module once, not per entry. Runs once, before that plugin's entries are collected; a plugin closes
over whatever it returns.

## `isEntry` — a plugin's own narrower view

The config's top-level `isEntry` decides what counts as an entry AT ALL. A plugin's own `isEntry`
narrows further, for outputs only some entries participate in (e.g. a data-contract file that only
entries with an `entity/io.ts` produce) — entries failing it never reach that plugin's `collect`.

## The rest of the module

- **`scan.ts`** (`discoverEntries`) — lists a root directory's immediate subdirectories matching
  `isEntry`, sorted by name. One scan per run, shared by every plugin.
- **`write.ts`** (`writeGeneratedFiles`) — writes every `{ path, content }` to disk, overwriting
  what's there. No incremental writes — every run overwrites its outputs in full.
- **`template.ts`** (`fromTemplate`/`fromEntryTemplate`) — turns a Handlebars file into a
  `render` function, so a plugin's text lives in its own `.hbs` file instead of string
  concatenation in the plugin's own code. `fromTemplate` wraps items as `{ items }` for
  `AggregatePlugin` (`{{#each items}}`); `fromEntryTemplate` renders one item's fields directly,
  no wrapper, for `PerEntryPlugin`.
- **`identifier.ts`** (`identifierFromEntryName`) — the one naming rule a barrel-shaped plugin is
  expected to reuse: a folder's name is the only source of the identifier a barrel imports it as
  (`identifierFromEntryName("radio-group", "Passport")` → `"radioGroupPassport"`), so the two can
  never drift apart.

All four are exported on their own too (`scan`/`write`/`template`/`identifier` are useful
independent of `run` — a dry run that only wants to inspect rendered text before anything touches
disk, for instance), but a product wiring an ordinary generator only needs `defineConfig`/`hasFile`/
the plugin types and `../cli.ts`.

## What this deliberately does not do

- **No plugin registry, no discovery.** A config's `plugins` array is exactly the plugins that
  run — nothing is auto-loaded from a folder or a package name. A shared plugin is just a function
  a product imports, same as any other module.
- **No opinion on what a plugin's own data means.** This module never assumes what a "component"
  or a "passport" is — that vocabulary belongs entirely to whichever plugin a product configures.
- **No watch mode.** One `run(config)` call does one full pass — the `vite dev` half of the
  analogy is not part of this yet.
