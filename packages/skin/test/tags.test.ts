import { describe, expect, it } from "vitest";

import { checkTags, DEFAULT_TAG, groupByTag, sortTags } from "../src/tags/index.js";

describe("sortTags — default первым, дальше по алфавиту", () => {
  it("puts default ahead of everything else, regardless of input order", () => {
    expect(sortTags(["zebra", DEFAULT_TAG, "apple"])).toEqual([DEFAULT_TAG, "apple", "zebra"]);
  });

  it("does not mutate the input array", () => {
    const input = ["b", "a"];
    sortTags(input);
    expect(input).toEqual(["b", "a"]);
  });
});

describe("checkTags — словарь передают, за ним не ходят", () => {
  it("flags a tag missing from the known set", () => {
    const flaws = checkTags(["known", "typo"], new Set(["known"]));
    expect(flaws).toEqual([
      { name: "unknown-tag", where: "tags", means: expect.stringContaining('"typo"') },
    ]);
  });

  it("passes a custom `where` through untouched", () => {
    const flaws = checkTags(["typo"], new Set(), "variantTags.solid");
    expect(flaws[0]!.where).toBe("variantTags.solid");
  });

  it("is empty when every tag is known", () => {
    expect(checkTags(["a", "b"], new Set(["a", "b"]))).toEqual([]);
  });
});

describe("groupByTag — variant→tags перевёрнуто в tag→variants", () => {
  it("groups variants under each tag they carry, sorted by sortTags", () => {
    const groups = groupByTag({
      solid: ["colors", DEFAULT_TAG],
      outline: ["colors"],
    });

    expect(groups).toEqual([
      { tag: DEFAULT_TAG, variants: ["solid"] },
      { tag: "colors", variants: ["solid", "outline"] },
    ]);
  });

  it("returns an empty array for a variant map with no tags at all", () => {
    expect(groupByTag({ solid: [] })).toEqual([]);
  });

  it("accepts the flat {name, tags}[] form (e.g. presets' variantsOf output) the same way as the dict", () => {
    const groups = groupByTag([
      { name: "solid", tags: ["colors", DEFAULT_TAG] },
      { name: "outline", tags: ["colors"] },
    ]);

    expect(groups).toEqual([
      { tag: DEFAULT_TAG, variants: ["solid"] },
      { tag: "colors", variants: ["solid", "outline"] },
    ]);
  });
});
