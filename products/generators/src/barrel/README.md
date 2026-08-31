# barrel

A small, dependency-free engine for one recurring shape of code generation:
scan a directory of uniformly-structured folders, and write one or more
aggregate files ("barrels") that list what each folder declares — instead of
a human maintaining that list by hand and eventually forgetting an entry.

This is the generic engine behind the idea. It does not know what a
"component" or a "passport" is — that vocabulary belongs to whichever zone
consumes it (its first consumer is `packages/ui/scripts/generate.mjs` in the
`probe-web` repository, which walks a UI kit's component folders to produce
its `passport.ts`/`kit.ts`/`io.ts`/`index.ts`). A barrel here is just: some
entries in, one rendered file out.

## Pipeline

```
discoverEntries  →  generateBarrels  →  writeGeneratedFiles
   (scan.ts)          (generate.ts)         (write.ts)
```

`runBarrelGeneration` (`run.ts`) chains all three for the common case where a
caller just wants the files written. Each stage is also exported on its own,
so a caller can inspect the generated content before anything touches disk
(useful for a dry run, or for a test that only wants to assert on text).

## Concepts

- **Entry** (`types.ts`) — one directory that qualified during the scan:
  a name and a path, nothing more.
- **BarrelSpec** (`types.ts`) — describes one output file: how to turn the
  entry list into whatever per-entry data this barrel needs (`collect`), an
  optional sanity check over that data (`validate`), and how to turn it into
  the file's text (`render`). A generation run can have several specs
  producing several output files from the same scan.
- **identifierFromEntryName** (`identifier.ts`) — the one naming rule every
  barrel is expected to reuse: a folder's name is the only source of the
  identifier a barrel imports it as, so the two can never drift apart.

## Rendering: a template file, not a hand-written function

`BarrelSpec.render` is just `(items) => string` — nothing stops a caller from
writing that function by hand, but the intended path is `fromTemplate`
(`template.ts`): point it at a Handlebars file, get a `render` function back.
The template owns the text (including loops over `items` via `{{#each}}`),
`collect` owns turning entries into the plain data the template interpolates.
This is the split that keeps a real consumer's generator script small: no
400-line file mixing scan logic, string concatenation, and domain data prep
in one place — the template's text lives in its own `.hbs` file, and the
script is just wiring (paths, what to collect, which template).

## Example

```ts
import { runBarrelGeneration, identifierFromEntryName, fromTemplate } from "@probe-web/generators/barrel";
import { existsSync } from "node:fs";
import { join } from "node:path";

runBarrelGeneration({
  rootDir: srcDir,
  isEntry: (entryPath) => existsSync(join(entryPath, "entity/passport.ts")),
  specs: [
    {
      outputPath: join(srcDir, "passport.ts"),
      collect: (entries) => entries.map((entry) => ({ name: entry.name })),
      render: fromTemplate(join(templatesDir, "passport.ts.hbs")),
    },
  ],
});
```

`passport.ts.hbs` would then read, e.g.:

```hbs
{{#each items}}
export * from "./{{name}}/entity/passport.js";
{{/each}}
```

## What this engine deliberately does not do

- **No opinion on what a barrel contains.** Rendering is a plain function
  from items to a string — this package never generates TypeScript AST or
  assumes a particular file shape.
- **No Nx, no build-tool integration.** A caller wires this into whatever
  runner it uses (an npm script, an Nx target, anything else); this engine
  does not know Nx exists.
- **No incremental writes.** Every run overwrites its output files in full —
  the same discipline the barrels themselves already relied on before this
  engine existed.
