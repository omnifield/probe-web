# scaffold

`barrel`'s mirror image: instead of collapsing every entry into ONE
aggregate file, `scaffold` writes ONE file PER entry — e.g. a README next to
each component, not a single file listing all of them.

Same pipeline shape as `barrel` (scan → collect/validate/render → write),
same `Entry`/`GeneratedFile` types, same `fromTemplate` for rendering — this
module only adds the "one file per entry" variant of the middle step.

## Pipeline

```
discoverEntries  →  generateScaffoldFiles  →  writeGeneratedFiles
 (../barrel/scan)      (generate.ts)           (../barrel/write)
```

`runScaffoldGeneration` (`run.ts`) chains all three, mirroring
`runBarrelGeneration` from `../barrel/run.ts`.

## Example

```ts
import { runScaffoldGeneration } from "@probe-web/generators/scaffold";
import { fromTemplate } from "@probe-web/generators/barrel";
import { join } from "node:path";

runScaffoldGeneration({
  rootDir: srcDir,
  isEntry: (entryPath) => existsSync(join(entryPath, "entity/passport.ts")),
  spec: {
    outputPathFor: (entry) => join(entry.path, "README.md"),
    collect: (entry) => ({ name: entry.name }),
    render: fromTemplate(join(templatesDir, "component-readme.md.hbs")),
  },
});
```

## Naming, not final

Called "scaffold" because that is the closest existing word for "one file
per item from a template" — it may end up renamed if a later Nx plugin for
scaffolding a brand-new component (a different, not-yet-started roadmap
item, `PWEB`/`GEN` — component creation from a prompt, closer to what Plop
does) claims the name first. Renaming here is cheap: nothing outside this
package depends on the name yet.
