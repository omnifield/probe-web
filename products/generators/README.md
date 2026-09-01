# @probe-web/generators

Generation tooling: what stamps something out in this repository, or keeps
something in sync with the disk, rather than the stamping itself. Started by
user decision on 2026-08-30 — replace the ad-hoc
`packages/ui/scripts/generate.mjs` with a reusable tool, and give a home to
other generators of the same kind (test data from a template, template-driven
text generation).

## Shape

- **Does not depend on Nx**, and does not require it — an Nx plugin is only
  one consumer of the engine here, not the engine itself.
- **Nothing depends on this directly.** It is a library of tools, opted into:
  a zone can keep its own ad-hoc script or take a ready-made plugin from
  here.
- **One engine, not several parallel ones.** Earlier revisions split the
  same "scan → collect → render → write" mechanics across `barrel` (one
  file from all entries) and `scaffold` (one file per entry), with a third
  layer bridging the two through an unsafe cast. Consolidated 2026-09-01
  (user's call — the split read as three copies of the same thing, not
  three real concerns): `engine` is now the only engine: one
  `EntryContext`, one `AggregatePlugin`/`PerEntryPlugin` pair, one runner.
  Renamed from `plugin` the same day (also user's call) — a folder named
  `plugin` holding zero actual plugins, only the machinery that RUNS them,
  read as if it were a plugin itself.

## Modules

| module | what it does |
|---|---|
| [`src/cli.ts`](#clits) | the actual entry point — loads a product's TypeScript config file and runs it, the way `vite`'s own CLI loads `vite.config.ts` |
| [`src/engine/`](src/engine/README.md) | the one engine — `vite`/`webpack`-shaped: a runner owns scanning/reading/writing/zone-merging, a plugin (an `AggregatePlugin`/`PerEntryPlugin` a caller supplies) is data plus a few functions |
| [`src/extract/`](src/extract/README.md) | read a real, executed value out of a TypeScript file (a passport, a Zod schema) instead of parsing its text |
| [`src/preserve/`](src/preserve/README.md) | one hand-written region, bracketed by markers, survives a full-file regeneration — the engine's `zones` call this automatically, so a plugin never invokes it itself |

## `cli.ts`

A product's whole generator becomes one TypeScript file:

```ts
// generators.config.ts
import { defineConfig, hasFile } from "@probe-web/generators/engine";

export default defineConfig({
  rootDir: "src",
  isEntry: hasFile("entity/passport.ts"),
  plugins: [/* ... */],
});
```

```
node .../products/generators/dist/cli.js ./generators.config.ts
```

No `fileURLToPath`/`dirname`/`await run(...)` boilerplate in the product's own script — `runCli`
loads the config by EXECUTING it (`extract`'s `importModule`, same as everywhere else here: a
config built by `defineConfig({...})` is a real value once it runs, not text worth parsing) and
calls `run` on it. `runCli` is exported on its own too, for a caller that wants the written files
back (tests, a wrapper script) instead of a process exit code.

## What's done

- `extract` — proven against a real component passport
  (`packages/ui/src/accordion/entity/passport.ts`), not just a fixture
  (`GEN-3`). `importModule` — fixed two gaps reported from `packages/ui`'s
  README pilot (2026-08-31): a transitive CommonJS dependency with no
  `exports` map (`fast-json-patch` under `@omnifield/probe-web-io`) failed
  to import, and a `.tsx` file with real Solid JSX failed to parse. Fixed
  by switching to `createServer()` + `server.ssrLoadModule()` (the path a
  real `vite dev` uses) and giving `importModule` a second, optional
  `InlineConfig` argument so a caller supplies its own fix
  (`ssr.noExternal`, `plugins: [solid()]`) without this package baking in
  knowledge of Solid or `packages/io` — see `src/extract/README.md`.
- `preserve` — one hand-written region survives regeneration; unchanged
  since it was written, still what the engine's `zones` calls underneath.
- `engine` — the `vite`/`webpack`-shaped runner (2026-09-01, user decision:
  a product's generator script should configure a tool, not hand-write
  filesystem plumbing). `EntryContext` replaces every `node:fs`/
  `node:path` call a product's own script used to make; `zones` replaces
  a plugin author calling `preserve` by hand. First landed (as a folder
  named `plugin`) as an additive layer on top of the (then-separate)
  `barrel`/`scaffold` engines, calling them through an unsafe cast;
  consolidated into its own `scan.ts`/`write.ts`/`template.ts`/
  `identifier.ts` the same day, once the cast made the redundancy
  obvious, then renamed `plugin` → `engine` (same day, same reason: a
  folder called `plugin` holding zero actual plugins read as if it were
  one) — see `src/engine/README.md`.
- `cli.ts` — the actual entry point (2026-09-01): a product's generator
  script is now ONE TypeScript config file plus one `node dist/cli.js
  <config>` call, no hand-rolled `run(...)` invocation — see `## cli.ts`
  above.
- Not done yet: reusable plugin BUNDLES (a ready `AggregatePlugin[]` for a
  "kit" product's passport/kit/io/index barrels, a `PerEntryPlugin` for a
  per-component README) living in this product, for `packages/ui` (and
  future kit-shaped products, e.g. `products/tables`'s planned migration
  to the same `entity`/`playground`/`components` layout) to import and
  configure rather than hand-write. `packages/ui/generators/` currently
  hand-writes its own barrel plugins directly against the engine's types —
  next step, once this consolidation is reviewed.
