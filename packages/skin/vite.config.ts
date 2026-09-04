// Shipping build — the factory from the `build` zone (`defineLibraryConfig`, `PROBEWEB-4`). Flat
// entries, no JSX among them at all — even `./solid` is plain reactive-primitive code, no raw
// JSX to preserve, so it doesn't need the two-branch `solid: true` treatment. Each source stays a
// flat file, not a folder's `index.ts`: `tsc`'s declaration emission mirrors the source tree
// literally, and a `src/model/index.ts` would emit `dist/model/index.d.ts` instead of the
// `dist/model.d.ts` this package's `exports` promises — tried it, broke every consumer's types
// (`packages/ui`, `apps/skin`). See `src/model.README.md` for the fuller account.
import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts" },
    { name: "model", source: "src/model.ts" },
    { name: "flat", source: "src/flat.ts" },
    { name: "editor", source: "src/editor.ts" },
    { name: "presets", source: "src/presets.ts" },
    { name: "wear", source: "src/wear.ts" },
    { name: "solid", source: "src/solid.ts" },
  ],
});
