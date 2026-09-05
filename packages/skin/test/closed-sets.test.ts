// `StatesOf`/`ValuesOf`/`PartOf` resolve to the REAL literal unions a passport declared, not
// `string` — only because `definePassport`/`defineSettings` stopped widening through a fixed
// interface on the way out (`const` type parameters, see
// `../src/engine/passport/form/{passport,settings}.ts`). `expectTypeOf` assertions are checked by
// `tsc` (`pnpm typecheck`); this test's runtime body is a no-op.

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expectTypeOf, it } from "vitest";

import { definePassport, defineSettings, type PartOf, type StatesOf, type ValuesOf } from "../src/engine/passport/form/index.js";

const anatomy = createAnatomy("toggle").parts("root", "thumb");

const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [{ name: "disabled", mark: { kind: "pseudo", name: ":disabled" } }] },
    {
      name: "thumb",
      states: [
        { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
      ],
    },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: defineSettings<{ orientation: string; multiple: boolean }>()({
    orientation: {
      values: { kind: "choice", options: [{ value: "vertical" }, { value: "horizontal" }] },
      byDefault: "vertical",
      mark: { kind: "attribute", name: "data-orientation" },
    },
    multiple: { values: { kind: "flag" }, byDefault: false },
  }),
});

describe("closed sets derived from a passport's own literal shape", () => {
  it("PartOf is the union of declared part names, not string", () => {
    expectTypeOf<PartOf<typeof passport>>().toEqualTypeOf<"root" | "thumb">();
  });

  it("StatesOf is scoped to ONE part — root and thumb do not see each other's states", () => {
    expectTypeOf<StatesOf<typeof passport, "root">>().toEqualTypeOf<"disabled">();
    expectTypeOf<StatesOf<typeof passport, "thumb">>().toEqualTypeOf<"checked" | "hover">();

    // @ts-expect-error — "checked" belongs to "thumb", not "root": a typo like this must not typecheck.
    expectTypeOf<StatesOf<typeof passport, "root">>().toEqualTypeOf<"checked">();
  });

  it("ValuesOf reads a choice setting's real option values, and boolean for a flag setting", () => {
    expectTypeOf<ValuesOf<typeof passport, "orientation">>().toEqualTypeOf<"vertical" | "horizontal">();
    expectTypeOf<ValuesOf<typeof passport, "multiple">>().toEqualTypeOf<boolean>();

    // @ts-expect-error — "diagonal" was never declared as an option.
    expectTypeOf<ValuesOf<typeof passport, "orientation">>().toEqualTypeOf<"vertical" | "diagonal">();
  });
});
