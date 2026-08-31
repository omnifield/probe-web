import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { importModule } from "../../src/extract/module.js";

const fixturesDir = join(import.meta.dirname, "fixtures");

describe("importModule", () => {
  it("executes the file and resolves a sibling import written with a .js extension pointing at .ts", async () => {
    const consumer = await importModule<typeof import("./fixtures/consumer.js")>(join(fixturesDir, "consumer.ts"));

    expect(consumer.describeFixture()).toBe("fixture:42");
  });

  it("returns the REAL computed result of a builder function, not its raw input literal", async () => {
    const consumer = await importModule<typeof import("./fixtures/consumer.js")>(join(fixturesDir, "consumer.ts"));

    expect(consumer.builtObject).toEqual({ label: "built", size: 3, computed: 30 });
  });
});
