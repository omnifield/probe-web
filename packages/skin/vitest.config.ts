import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Two projects, because this zone's tests live in different worlds:
//
//   • model — the model, recipe assembly, checks, and text generation. No document, no JSX there
//     at all: the mechanic turns DATA into TEXT and must work where no document exists — in
//     storage, in a server build, in validating a saved skin;
//   • kit   — the same generated text, worn on a LIVE button: a real component, a real passport,
//     real markup. A separate project because of the pipeline: the kit arrives as the `solid`
//     branch — UNtransformed JSX, and we apply the transform ourselves (the same decision and the
//     same reason as the `ui`, `runtime`, and `assembly` zones).
//
// The `@omnifield/probe-web-build/vitest` preset is NOT wired in here: dependency direction
// between zones is one-way (`PROBEWEB-4`), and the preset isn't for the package's own tests.

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "model",
          environment: "node",
          include: ["test/*.test.ts"],
        },
      },
      {
        plugins: [solid()],
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "kit",
          environment: "jsdom",
          include: ["test/*.test.tsx"],
          // All foreign code goes through our pipeline: the kit and its foundations arrive as
          // untransformed JSX, and a list of names would need updating on every level of foreign
          // dependencies. The rule is general, not a list — same as in the `assembly` zone.
          //
          // Exactly one exception, and it's named: postcss with its dependents. Written as a
          // NEGATION — "everything except postcss" — not as a list of what's needed: a list of
          // what's needed is exactly the list that would need updating on every new level of
          // foreign dependencies.
          //
          // Why the exception exists at all: postcss has no JSX whatsoever, but some of its files
          // reference source maps that aren't in the shipped package, and the pipeline prints a
          // paragraph about it on every run. Noise in test output is more dangerous than it looks:
          // it drowns out a real complaint.
          server: { deps: { inline: [/^(?!.*postcss).*$/] } },
        },
      },
    ],
  },
});
