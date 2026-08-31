# editor.ts

The `./editor` subpath (`PWEB-115`) — the passport's EDITOR slice: everything only a human or the
product's editor mechanic reads, and that `generateSkinCss`/`checkOutfit`/`assemble` never touch.

A separate entry, not part of `./model` or the root — and this is NOT style, it's the boundary
itself: an app that imports `.`/`./model` creates NO reference to a single binding in this file, and
the bundler is free to drop the editor data (`means`, assemblies) as dead code. Importing `./editor`
is a deliberate act by whoever is actually building an editor, not an accidental leak through the
shared entry.

Design, rationale, and the declaration recipe — in `passport/editor/README.md`.

**Why this file stays flat, not a folder** — same reason as `model.README.md`: a build entry point
named by exact path in `vite.config.ts` and `package.json`'s `exports`; moving it into a folder
makes `tsc` emit `dist/editor/index.d.ts` instead of the `dist/editor.d.ts` the manifest promises.

## Base assembly (`PWEB-89`)

The holder moved to `PassportEditorInfo.assemblies` and became a list (`PWEB-115`); the tree
declaration and its unfolding into flat form stayed right here, where they always were.
