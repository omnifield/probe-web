// Live proof for PWEB-209, point 2 — a `Data` type argument on `PassportAssembly` catches a typo
// in `bind`/`repeat.path`/content `value`, at EVERY nesting level, on the SAME two-level shape
// (`sections`, and inside each section, `items`) as `test/paths.test.ts`, now wired into the real
// assembly node types instead of the bare utilities. Mirrors accordion's actual
// `playground/assemblies/action-list.ts` tree shape (two repeats, one nested inside the other's
// `itemContent`) — this is the acid test the ticket named before any of this reaches the kit.
//
// Negative cases are checked on a NAMED, explicitly-typed node at the level they belong to, not
// buried three levels deep inside one giant literal for the whole tree: found, while writing this
// test, that a mismatch nested that deep inside a single object literal gets misattributed by `tsc`
// to an unrelated, unrelated-looking line near the top of the SAME literal (the `repeat` on the
// outer node, in one run) — a real DX cost of the mapped-type-per-`repeat.path` device this ticket
// warned about in advance ("нечитаемые тултипы"), now confirmed to also affect ERROR LOCATION, not
// only hover text. Authoring a real assembly as one unbroken literal will hit the same thing;
// `./README.md#nodes` carries the guidance forward (name a sub-tree, don't nest the whole thing).
//
// `expectTypeOf`/`@ts-expect-error` are checked by `tsc` (`pnpm typecheck`); this test's runtime
// body is a no-op, same device as the other PWEB-205 proofs.
//
// `path: ""` (`BoundPath`'s self-reference sentinel — "the whole current node/Data", the same
// marker `binding.ts`'s `resolveDataBinding` special-cases) was MISSING from the first cut of this
// mechanism — found by the ui-architect piloting a real, shipping `Data` type argument against
// accordion's ACTUAL `playground/assemblies/base.ts`, not a synthetic case: that file's button
// reference genuinely writes `bind: {..., payload: ""}` and `context: {payload: {path: ""}}`
// (mirroring `button`'s own `selfAssembly`), and neither typechecked before this fix. The "valid
// tree" case below carries both, verbatim, so this exact regression can't come back unnoticed.

import { describe, expectTypeOf, it } from "vitest";

import type { PassportAssembly, PassportAssemblyNode } from "../src/passport/assembly/index.js";

// Mirrors `packages/ui/src/accordion/entity/io.ts`'s `z.infer<typeof input>` — not imported: this
// test is about the type machinery, not that specific schema (same stance as `paths.test.ts`).
interface Item {
  readonly id: string;
  readonly title: string;
}

interface Section {
  readonly id: string;
  readonly title: string;
  readonly items?: readonly Item[];
}

interface AccordionInput {
  readonly sections: readonly Section[];
}

type Part = "root" | "item" | "itemTrigger" | "itemContent" | "itemIndicator";
type Registry = "button";

describe("PassportAssembly<Part, Registry, Data> — real accordion-shaped tree (PWEB-209)", () => {
  it("accepts the actual tree: absolute repeat at the root, relative everything below it", () => {
    const valid: PassportAssembly<Part, Registry, AccordionInput> = {
      name: "action-list",
      means: "proof",
      tree: {
        node: "root",
        children: [
          {
            node: "item",
            repeat: { path: "/sections" },
            bind: { value: "id" },
            children: [
              {
                node: "itemTrigger",
                children: [
                  { genus: "text", value: { path: "title" } },
                  { node: "itemIndicator", children: [] },
                ],
              },
              {
                node: "itemContent",
                children: [
                  {
                    node: "button",
                    repeat: { path: "items" },
                    bind: { value: "id", label: "title", payload: "" },
                    on: {
                      click: {
                        event: { name: "triggerClick", context: { payload: { path: "" } } },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    expectTypeOf(valid).toMatchTypeOf<PassportAssembly<Part, Registry, AccordionInput>>();
  });

  it("rejects a relative repeat path at the untouched root — nothing has narrowed anything yet", () => {
    const wrongFormat: PassportAssemblyNode<Part, Registry, AccordionInput, true> = {
      node: "item",
      // @ts-expect-error — "sections" (no leading "/") is only legal once already inside a repeat.
      repeat: { path: "sections" },
    };
    void wrongFormat;
  });

  it("rejects an absolute path where the tree has already been narrowed by an ancestor repeat", () => {
    const wrongFormat: PassportAssemblyNode<Part, Registry, Section, false> = {
      node: "button",
      // @ts-expect-error — "/items" is absolute; from inside the outer repeat this must be relative ("items").
      repeat: { path: "/items" },
    };
    void wrongFormat;
  });

  it("\"\" (self-reference) is legal in bind and in DispatchAction's context, at any AtRoot", () => {
    const selfRef: PassportAssemblyNode<Part, Registry, Item, false> = {
      node: "button",
      bind: { value: "id", label: "title", payload: "" },
      on: { click: { event: { name: "click", context: { payload: { path: "" } } } } },
    };
    expectTypeOf(selfRef).toMatchTypeOf<PassportAssemblyNode<Part, Registry, Item, false>>();

    const selfRefAtRoot: PassportAssemblyNode<Part, Registry, AccordionInput, true> = {
      node: "root",
      bind: { whole: "" },
    };
    expectTypeOf(selfRefAtRoot).toMatchTypeOf<PassportAssemblyNode<Part, Registry, AccordionInput, true>>();
  });

  it("\"\" does not swallow a real typo next to it", () => {
    const typo: PassportAssemblyNode<Part, Registry, Item, false> = {
      node: "button",
      // @ts-expect-error — "titel" is still a typo even though "payload" (a sibling key) legally holds "".
      bind: { payload: "", label: "titel" },
    };
    void typo;
  });

  it("rejects a typo in bind two levels deep, inside the nested repeat", () => {
    const typo: PassportAssemblyNode<Part, Registry, Item, false> = {
      node: "button",
      // @ts-expect-error — "titel" is a typo; the item's own field is "title".
      bind: { label: "titel" },
    };
    void typo;
  });

  it("the untyped default (no Data argument) stays fully permissive, same as before PWEB-209", () => {
    const untyped: PassportAssembly<Part, Registry> = {
      name: "x",
      means: "x",
      tree: {
        node: "item",
        repeat: { path: "whatever-nobody-checks" },
        bind: { x: "literally-anything" },
        children: [{ node: "itemTrigger", bind: { y: "also-anything" } }],
      },
    };
    expectTypeOf(untyped).toMatchTypeOf<PassportAssembly<Part, Registry>>();
  });
});
