# flat.ts

The `./flat` subpath — the flat output form, and ONLY that.

Narrow on purpose. Unwrapping is backed by postcss and its dependents, and it lands in the
consumer's bundle from a single import; bundling the model and generation in here too would make
"postcss only where needed" rest on the consumer importing the right name from a wide entry — and
that isn't a mechanism.

Whoever needs both forms takes both: generation from `.`, unwrapping from here.

**Why this file stays flat, not a folder** — same reason as `model.README.md`: a build entry point
named by exact path in `vite.config.ts` and `package.json`'s `exports`; moving it into a folder
makes `tsc` emit `dist/flat/index.d.ts` instead of the `dist/flat.d.ts` the manifest promises.
