import { describe, expect, it } from "vitest";
import { z } from "@web-core/io";
import { limitSchema, paginate } from "../src/pagination/index.js";

describe("paginate", () => {
  const items = Array.from({ length: 5 }, (_, i) => i);

  it("returns the first page with a nextCursor when more items remain", () => {
    const page = paginate(items, { limit: 2 });
    expect(page.items).toEqual([0, 1]);
    expect(page.nextCursor).toBeDefined();
  });

  it("walks all pages to the end without repeats or gaps", () => {
    const seen: number[] = [];
    let cursor: string | undefined;
    do {
      const page = paginate(items, { limit: 2, cursor });
      seen.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor !== undefined);
    expect(seen).toEqual(items);
  });

  it("omits nextCursor once the last item is included", () => {
    const page = paginate(items, { limit: 10 });
    expect(page.items).toEqual(items);
    expect(page.nextCursor).toBeUndefined();
  });

  it("treats a garbage cursor as the start, not a crash", () => {
    const page = paginate(items, { cursor: "not-a-real-cursor!!", limit: 2 });
    expect(page.items).toEqual([0, 1]);
  });

  it("defaults to a limit of 20 when none is given", () => {
    const page = paginate(items);
    expect(page.items).toEqual(items);
    expect(page.nextCursor).toBeUndefined();
  });

  it("the default actually bites on a set bigger than the default", () => {
    const big = Array.from({ length: 25 }, (_, i) => i);
    const page = paginate(big);
    expect(page.items).toHaveLength(20);
    expect(page.nextCursor).toBeDefined();
  });
});

describe("limitSchema", () => {
  it("prints a real ceiling in JSON Schema, not the language's max safe integer", () => {
    const jsonSchema = z.toJSONSchema(limitSchema) as { maximum?: number };
    expect(jsonSchema.maximum).toBe(100);
    expect(jsonSchema.maximum).not.toBe(Number.MAX_SAFE_INTEGER);
  });

  it("rejects a value above the ceiling", () => {
    expect(limitSchema.safeParse(101).success).toBe(false);
    expect(limitSchema.safeParse(100).success).toBe(true);
  });
});
