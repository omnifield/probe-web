// Проверено на реальной вложенности accordion (sections/items), не на синтетической.
// `expectTypeOf`/`@ts-expect-error` проверяет `tsc`; рантайм-тело — no-op.

import { describe, expectTypeOf, it } from "vitest";

import type { ArrayPaths, ElementAt, Paths } from "../src/engine/passport/assembly/paths.js";

// Mirrors `packages/ui/src/accordion/entity/io.ts`'s `z.infer<typeof input>` — not imported from
// there: `packages/skin` does not depend on `packages/ui` or on `packages/io`/zod at all, and this
// test is about the TYPE MACHINERY, not that specific schema.
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

describe("Paths<T> проваливается сквозь массив без индекса", () => {
  it("names the array itself as a leaf path", () => {
    expectTypeOf<"sections">().toMatchTypeOf<Paths<AccordionInput>>();
  });

  it("also names paths ONE level past the array — the element's own fields, no index", () => {
    expectTypeOf<"sections/id">().toMatchTypeOf<Paths<AccordionInput>>();
    expectTypeOf<"sections/title">().toMatchTypeOf<Paths<AccordionInput>>();
  });

  it("keeps falling through a SECOND array nested inside the first element", () => {
    expectTypeOf<"sections/items">().toMatchTypeOf<Paths<AccordionInput>>();
    expectTypeOf<"sections/items/title">().toMatchTypeOf<Paths<AccordionInput>>();
  });

  it("rejects a name that was never a field anywhere in the schema", () => {
    // @ts-expect-error — "sections/titel" is a typo, not a declared field.
    expectTypeOf<"sections/titel">().toMatchTypeOf<Paths<AccordionInput>>();
  });

  it("computed relative to an ELEMENT type directly — the shape a repeat's template actually sees", () => {
    expectTypeOf<Paths<Section>>().toEqualTypeOf<"id" | "title" | "items" | "items/id" | "items/title">();
  });
});

describe("ArrayPaths<T> — только пути, ведущие в массив", () => {
  it("accepts a real array path, at either nesting level", () => {
    expectTypeOf<"sections">().toMatchTypeOf<ArrayPaths<AccordionInput>>();
    expectTypeOf<"items">().toMatchTypeOf<ArrayPaths<Section>>();
  });

  it("rejects a path that leads to a plain field — repeat over a string must not typecheck", () => {
    // @ts-expect-error — "sections/title" resolves to a string, not an array: not a legal repeat target.
    expectTypeOf<"sections/title">().toMatchTypeOf<ArrayPaths<AccordionInput>>();
  });
});

describe("ElementAt<T, K> — данные, которые видит шаблон повтора", () => {
  it("narrows to the element type, not the array and not the parent Data", () => {
    expectTypeOf<ElementAt<AccordionInput, "sections">>().toEqualTypeOf<Section>();
  });

  it("chains: the element of a nested repeat is reached by narrowing twice, once per level", () => {
    type SectionData = ElementAt<AccordionInput, "sections">;
    type ItemData = ElementAt<SectionData, "items">;
    expectTypeOf<ItemData>().toEqualTypeOf<Item>();
  });
});
