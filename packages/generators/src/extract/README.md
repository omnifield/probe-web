# extract

Reads real, executed values out of a TypeScript file — not text parsed from
it. One function: `importModule(path)`.

## Why not parse the file's text instead

Data worth documenting (a component's passport, a Zod schema) is rarely a
plain object literal sitting in the file — it is built by calling helper
functions (`definePassport(...)`, `defineSettings<Props>()({...})`,
`z.object({...})`). A static/AST reader would have to reimplement whatever
those functions do internally just to guess the result, and that
reimplementation drifts the moment the real function's behavior changes.
Importing the file and reading what it actually exported has no such
problem — it IS the real function running, the same object the rest of the
app already sees.

## How

`importModule` runs a headless `createServer()` + `server.ssrLoadModule()` —
the same dev-server path a real `vite dev` uses, spun up and torn down
around one import. It resolves this repository's own import convention (a
relative specifier written with a `.js` extension pointing at a sibling
`.ts` file) exactly like the real build does, with no separate compile
step.

```ts
import { importModule } from "@web-core/generators/extract";

const { passport } = await importModule<typeof import("./entity/passport.js")>(
  "/absolute/path/to/entity/passport.ts",
);

console.log(passport.parts.map((part) => part.name));
```

## Second argument: a caller's own Vite needs

`importModule(path, config?)` takes an optional `InlineConfig` (from
`vite`), merged in — this package's own required settings (headless SSR
mode) win on conflicts, everything else passes through. Two real cases so
far:

- **A transitive CommonJS dependency with no `exports` map** fails with
  "named export not found", the same way plain Node's ESM interop would —
  `fast-json-patch` under `@web-core/io` is one. Fix:
  `{ ssr: { noExternal: ["fast-json-patch"] } }`.
- **A `.tsx` file with real Solid JSX** fails to parse — the bare tool
  knows nothing about JSX presets. Fix: `{ plugins: [solid()] }`
  (`vite-plugin-solid`).

Neither fix lives inside this package: `importModule` stays generic (no
Solid, no `packages/io` knowledge baked in), and the caller who actually
needs the workaround supplies it.

## Zod schemas need no extra tool

Once a real Zod schema comes back from `importModule`, Zod v4 already
converts it to plain field data itself — `z.toJSONSchema(schema)`, built in,
no separate package. (The third-party `zod-to-json-schema` project stopped
active maintenance for exactly this reason once Zod shipped it natively.)
This module does not wrap that call — wrapping a one-line built-in would
only add indirection, not behavior.
