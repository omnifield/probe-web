// Shipping build — the factory from the `build` zone (`defineLibraryConfig`, `PROBEWEB-4`). Four
// flat entries, no JSX among them at all — the skin mechanic doesn't render, it computes. Each
// source stays a flat file, not a folder's `index.ts`: `tsc`'s declaration emission mirrors the
// source tree literally, and a `src/model/index.ts` would emit `dist/model/index.d.ts` instead of
// the `dist/model.d.ts` this package's `exports` promises — tried it, broke every consumer's types
// (`packages/ui`, `products/skin`). See `src/model.README.md` for the fuller account.
import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts" },
    { name: "model", source: "src/model.ts" },
    { name: "flat", source: "src/flat.ts" },
    { name: "editor", source: "src/editor.ts" },
    { name: "presets", source: "src/presets.ts" },
  ],
});
