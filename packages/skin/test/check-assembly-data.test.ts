// `checkAssemblyData` — the value half of assembly validation, `checkAssembly`'s own README
// section names the gap this closes: structure is checked, `bind`/`repeat.path` never was.
//
// "Broken" fixtures below are typed `PassportAssembly<Part, Registry>` — the UNTYPED default
// (`Data = unknown`), not `PassportAssembly<Part, Registry, ListInput>`. That is not an oversight:
// a real, `Data`-typed literal with a typo in `bind`/`repeat.path` does not compile at all
// (`BoundPath`, `../assembly/paths.ts`) — `tsc` already rejects it, which is exactly why this
// function exists for the OTHER case, JSON arriving with no compiler over it at all. The untyped
// fixtures below are what that JSON looks like on the way in.

import { describe, expect, it } from "vitest";
import { checkAssemblyData } from "../src/passport/editor/check-assembly-data.js";
import type { PassportAssembly } from "../src/passport/assembly/index.js";

interface Item {
  readonly id: string;
  readonly title: string;
}

interface ListInput {
  readonly items: readonly Item[];
}

// Real `Data`, compiler-checked — proves the happy path end to end, not just runtime-clean.
const rows: PassportAssembly<"root" | "item", string, ListInput> = {
  name: "rows",
  means: "proof",
  tree: {
    node: "root",
    children: [{ node: "item", repeat: { path: "/items" }, bind: { value: "id", label: "title" } }],
  },
};

describe("checkAssemblyData", () => {
  it("passes clean on a real, compiler-checked assembly matching its own schema", () => {
    const data: ListInput = { items: [{ id: "a", title: "A" }] };
    expect(checkAssemblyData("list", rows, data)).toEqual([]);
  });

  it("flags a repeat.path that resolves to nothing — the untyped/JSON case tsc cannot see", () => {
    const broken: PassportAssembly<"root" | "item"> = {
      name: "rows",
      means: "proof",
      tree: { node: "root", children: [{ node: "item", repeat: { path: "/nope" }, bind: { value: "id" } }] },
    };

    const flaws = checkAssemblyData("list", broken, { items: [] });
    expect(flaws).toHaveLength(1);
    expect(flaws[0]).toMatchObject({ path: "/nope", means: expect.stringContaining("resolves to nothing") });
  });

  it("flags a repeat.path that resolves to a non-array, separately from a missing path", () => {
    const flaws = checkAssemblyData("list", rows, { items: "not-a-list" });
    expect(flaws).toHaveLength(1);
    expect(flaws[0]).toMatchObject({ path: "/items", means: expect.stringContaining("non-array") });
  });

  it("does not cascade: a bad repeat.path does not also flag every bind inside its (unreached) template", () => {
    const broken: PassportAssembly<"root" | "item"> = {
      name: "rows",
      means: "proof",
      tree: {
        node: "root",
        children: [{ node: "item", repeat: { path: "/nope" }, bind: { value: "id", label: "also-bad" } }],
      },
    };

    expect(checkAssemblyData("list", broken, { items: [] })).toHaveLength(1);
  });

  it("flags a bad bind path INSIDE a repeat, scoped to the element, not the root", () => {
    const typo: PassportAssembly<"root" | "item"> = {
      name: "rows",
      means: "proof",
      tree: {
        node: "root",
        children: [{ node: "item", repeat: { path: "/items" }, bind: { value: "id", label: "totallyNotAField" } }],
      },
    };

    const flaws = checkAssemblyData("list", typo, { items: [{ id: "a", title: "A" }] });
    expect(flaws).toHaveLength(1);
    expect(flaws[0]).toMatchObject({ path: "totallyNotAField", where: expect.stringContaining("bind.label") });
  });

  it("resolves an absolute top-level path and catches its own typo the same way", () => {
    const absolute: PassportAssembly<"root"> = { name: "single", means: "proof", tree: { node: "root", bind: { value: "/items" } } };
    expect(checkAssemblyData("list", absolute, { items: [{ id: "a", title: "A" }] })).toEqual([]);

    const brokenAbsolute: PassportAssembly<"root"> = { name: "single", means: "proof", tree: { node: "root", bind: { value: "/nope" } } };
    expect(checkAssemblyData("list", brokenAbsolute, { items: [{ id: "a", title: "A" }] })).toHaveLength(1);
  });

  it("merges a ref's own bind over the template's, checking what actually resolves at the use site", () => {
    const withRef: PassportAssembly<"root" | "item"> = {
      name: "ref-case",
      means: "proof",
      tree: { node: "root", children: [{ ref: "row", bind: { value: "/items" } }] },
      refs: { row: { node: "item", bind: { value: "id" } } },
    };

    // The ref overrides `value` to a path the template never had — proof the merge, not the bare
    // template, is what gets checked.
    expect(checkAssemblyData("list", withRef, { items: [{ id: "a", title: "A" }] })).toEqual([]);

    const overriddenBadly: PassportAssembly<"root" | "item"> = {
      ...withRef,
      tree: { node: "root", children: [{ ref: "row", bind: { value: "/nope" } }] },
    };
    expect(checkAssemblyData("list", overriddenBadly, { items: [{ id: "a", title: "A" }] })).toHaveLength(1);
  });

  it('treats the empty-string path ("whole current node") as always legal', () => {
    const whole: PassportAssembly<"root"> = { name: "whole", means: "proof", tree: { node: "root", bind: { value: "" } } };
    expect(checkAssemblyData("thing", whole, "any value at all")).toEqual([]);
  });
});
