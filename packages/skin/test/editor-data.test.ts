// Live proof for the ui-architect's follow-up finding: a real `Data` type argument on
// `PassportAssembly` refused to widen into `PassportEditorSpec.assemblies`'s old two-parameter
// form — `defineEditorInfo(passport, {assemblies: [typedAssembly]})` failed with "Type '...' is not
// assignable to type 'DataBinding<unknown, true>'" even though the two shapes structurally overlap.
// Threading `Data` through `PassportEditorSpec`/`PassportEditorInfo`/`defineEditorInfo`/
// `checkAssembly` (rather than leaning on that widening) is the fix.
//
// This mirrors the FULL chain the finding asked to prove, end to end, with ZERO `as`/`as unknown as`
// anywhere in it: a real io schema (stand-in for `entity/io.ts`) → a `PassportAssembly` typed
// against it (stand-in for `playground/assemblies/*.ts`) → a collected array (stand-in for
// `playground/assemblies/index.ts`) → `defineEditorInfo`, called with ZERO explicit type
// arguments — Part/Registry/Data all inferred, same call shape every real component in the kit
// already uses — → the RESULT's `.assemblies`, still carrying the real `Data`, not widened away.
//
// `expectTypeOf`/`@ts-expect-error` are checked by `tsc` (`pnpm typecheck`); this test's runtime
// body also genuinely runs `defineEditorInfo` (unlike the other PWEB-209 proofs) — it is the
// existing RUNTIME contract, not only the new compile-time one, that must keep holding.

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, expectTypeOf, it } from "vitest";

import { defineEditorInfo, type PassportEditorInfo } from "../src/passport/editor/index.js";
import type { PassportAssembly } from "../src/passport/assembly/index.js";
import { definePassport } from "../src/passport/form/index.js";

// Stand-in for a component's `entity/io.ts` — not imported from `packages/io`/zod, same stance as
// the other PWEB-209 proofs: this is about the type machinery, not any one real schema.
interface Item {
  readonly id: string;
  readonly title: string;
}

interface ListInput {
  readonly items: readonly Item[];
}

const anatomy = createAnatomy("list").parts("root", "item");

// Stand-in for `entity/passport.ts`.
const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "item", states: [] },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

// Stand-in for ONE file under `playground/assemblies/` — typed against the real schema, no cast.
const rows: PassportAssembly<"root" | "item", string, ListInput> = {
  name: "rows",
  means: "proof",
  tree: {
    node: "root",
    children: [{ node: "item", repeat: { path: "/items" }, bind: { value: "id", label: "title" } }],
  },
};

// Stand-in for `playground/assemblies/index.ts`'s collected array — no cast.
const assemblies = [rows];

describe("defineEditorInfo threads a real Data through, no widening needed (PWEB-209 follow-up)", () => {
  it("accepts a real-Data PassportAssembly in spec.assemblies with zero explicit type arguments", () => {
    // Stand-in for `playground/index.ts`'s call — same shape every component in the kit already
    // uses (nothing explicit): Part/Registry/Data all inferred.
    const editorInfo = defineEditorInfo(passport, {
      package: "@omnifield/probe-web-ui",
      genus: "component",
      variantAxis: { means: "proof" },
      parts: {
        root: { means: "proof" },
        item: { means: "proof" },
      },
      settings: {},
      assemblies,
      dataPresets: [],
    });

    // Stand-in for `test/accordion.test.tsx`'s use of `editorInfo.assemblies` — still carries the
    // real Data, not widened to `unknown`: a typo here would be caught, same as at the source.
    // Fourth type argument (`typeof passport`, not the default widened `ComponentPassport<...>`) —
    // `defineEditorInfo` now infers `Passport` from the real argument (states/values wiring
    // follow-up); `toEqualTypeOf` needs the exact match, `toMatchTypeOf` alone would not have caught
    // a regression here.
    expectTypeOf(editorInfo).toEqualTypeOf<PassportEditorInfo<"root" | "item", string, ListInput, typeof passport>>();
    expect(editorInfo.assemblies).toHaveLength(1);
    expect(editorInfo.assemblies[0]!.tree.node).toBe("root");
  });

  it("a typo introduced at the SOURCE (the assembly itself) is still caught, all the way through", () => {
    const typo: PassportAssembly<"root" | "item", string, ListInput> = {
      name: "rows",
      means: "proof",
      tree: {
        node: "root",
        // @ts-expect-error — "titel" is a typo; Item's own field is "title".
        children: [{ node: "item", repeat: { path: "/items" }, bind: { label: "titel" } }],
      },
    };
    void typo;
  });
});
