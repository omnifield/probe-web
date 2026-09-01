# plugins/kit

Ready-made plugins for a "kit" product — one folder per component under some `rootDir`, each
declaring `entity/passport.ts` (required), `playground/index.ts` (required), `components/kit.ts(x)`
(required), and an optional `entity/io.ts`. `packages/ui` is this shape; `products/tables` is
planned to move onto the same layout (GEN-9) — this module exists so a second product on that
layout configures a ready plugin bundle instead of copy-pasting `packages/ui`'s.

```ts
import { defineConfig, hasFile } from "@probe-web/generators/engine";
import { kitBarrelPlugins } from "@probe-web/generators/plugins/kit";

export default defineConfig({
  rootDir: srcDir,
  isEntry: hasFile("entity/passport.ts"),
  plugins: kitBarrelPlugins({
    outputDir: srcDir,
    templatesDir: join(thisDir, "templates", "barrel"),
  }),
});
```

## What this owns, what it doesn't

`kitBarrelPlugins` owns the DATA each of the four barrels (`passport.ts`/`kit.ts`/`io.ts`/
`index.ts`) needs — which fields to collect per entry, which entries even qualify for `io.ts`
(only ones with `entity/io.ts`), the "component declared anatomy but no part map" validation. All
of that is identical across any product sharing the kit layout.

It does NOT own the generated files' actual TEXT — imports, comments, type names differ per
product (`packages/ui`'s `kit.ts` imports `KitComponent` from its own `kit-form.js`; a different
product would not). That stays a Handlebars template the CALLER supplies via `templatesDir` — this
module renders through it (`fromTemplate`, `../../engine`), never writes TypeScript scaffolding by
hand.

## Why one function returning four plugins, not four separate exports

All four share one scan (the same `rootDir`/`isEntry`) and, for `packages/ui` today, always run
together — a caller that only wants three of them can still filter the returned array, but nothing
here forces splitting the common case into four import statements.
