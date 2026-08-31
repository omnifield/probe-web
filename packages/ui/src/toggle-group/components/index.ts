// OUTWARD FACE of this folder's components — a plain re-export list, nothing defined here.
//
// The real implementations (and the passport-part map built from them) live in `./kit.tsx` — see
// its own header comment for why the two used to be swapped (`PWEB-195` continuation,
// 2026-08-30): before this, `index.tsx` held the real implementations (wrong — an "index" is a
// facade by every other convention in this codebase) and `kit.ts` had to import the very
// components it was named to just describe.

export * from "./kit.jsx";
