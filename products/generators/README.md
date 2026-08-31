# @probe-web/generators

Generation tooling: what stamps something out in this repository, or keeps
something in sync with the disk, rather than the stamping itself. Started by
user decision on 2026-08-30 — replace the ad-hoc
`packages/ui/scripts/generate.mjs` with a reusable tool, and give a home to
other generators of the same kind (test data from a template, template-driven
text generation).

## Shape

- **Does not depend on Nx**, and does not require it — an Nx plugin is only
  one consumer of the engines here, not the engine itself.
- **Nothing depends on this directly.** It is a library of tools, opted into:
  a zone can keep its own ad-hoc script or take a ready-made generator from
  here.
- **Mechanics, no application** — no Vite, no dev server here; this product
  is consumed as exported modules, called from someone else's script or
  build-tool target.

## Modules

| module | what it does |
|---|---|
| [`src/barrel/`](src/barrel/README.md) | scan a directory of uniform folders, render one or more aggregate files from what each folder declares |
| [`src/extract/`](src/extract/README.md) | read a real, executed value out of a TypeScript file (a passport, a Zod schema) instead of parsing its text |
| [`src/scaffold/`](src/scaffold/README.md) | `barrel`'s mirror image — one file PER entry (e.g. a README next to each component), not one aggregate for all of them |

## What's done

- `barrel` — wired into `packages/ui/scripts/generate.mjs` in place of the
  ad-hoc script it used to be (`GEN-1`).
- `extract` — proven against a real component passport
  (`packages/ui/src/accordion/entity/passport.ts`), not just a fixture
  (`GEN-3`).
- `scaffold` — one-file-per-entry generation, tested end to end against a
  real temporary directory tree (`GEN-4`).
- Proven against a copied, realistic fixture (`test/fixtures/accordion/`,
  unedited copy of `packages/ui/src/accordion/entity/`) so testing does not
  depend on files a live component-kit session is actively editing
  (`GEN-5`). Passport extraction works end to end; `io.ts`/Zod extraction is
  blocked upstream by a `packages/io` bug (`fast-json-patch` named-export
  interop under plain Node), not by anything here — see
  `test/extract/accordion-fixture.test.ts`.
- Not wired into anything yet: the actual per-component README template and
  its hookup into `packages/ui` is next (`GEN-5`).
- `importModule` — fixed two gaps reported from `packages/ui`'s README
  pilot (2026-08-31): a transitive CommonJS dependency with no `exports`
  map (`fast-json-patch` under `@omnifield/probe-web-io`) failed to import,
  and a `.tsx` file with real Solid JSX failed to parse. Root cause was the
  same for both — `importModule` ran on `runnerImport()`'s "inline"
  environment, which hardcodes external resolution and has no CJS runtime
  under it. Switched to `createServer()` + `server.ssrLoadModule()` (the
  path a real `vite dev` uses) and gave `importModule` a second, optional
  `InlineConfig` argument so a caller supplies its own fix
  (`ssr.noExternal`, `plugins: [solid()]`) without this package baking in
  knowledge of Solid or `packages/io` — see `src/extract/README.md`.
