import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { toEntryContext } from "../../src/engine/context.js";

let entryPath: string;

beforeEach(() => {
  entryPath = mkdtempSync(join(tmpdir(), "probe-web-generators-context-"));
  mkdirSync(join(entryPath, "entity"), { recursive: true });
  writeFileSync(join(entryPath, "entity", "passport.ts"), "export const mark = 42;\n", "utf8");
});

afterEach(() => {
  rmSync(entryPath, { recursive: true, force: true });
});

describe("toEntryContext", () => {
  it("resolves a relative path against the entry's own directory", () => {
    const entry = toEntryContext({ name: "accordion", path: entryPath });

    expect(entry.resolve("entity/passport.ts")).toBe(join(entryPath, "entity", "passport.ts"));
  });

  it("has() is true for a file inside the entry and false for one that is not there", () => {
    const entry = toEntryContext({ name: "accordion", path: entryPath });

    expect(entry.has("entity/passport.ts")).toBe(true);
    expect(entry.has("entity/io.ts")).toBe(false);
  });

  it("read() returns the file's raw text", () => {
    const entry = toEntryContext({ name: "accordion", path: entryPath });

    expect(entry.read("entity/passport.ts")).toBe("export const mark = 42;\n");
  });

  it("importModule() executes a file relative to the entry and returns its real exports", async () => {
    const entry = toEntryContext({ name: "accordion", path: entryPath });

    const module = await entry.importModule<{ mark: number }>("entity/passport.ts");

    expect(module.mark).toBe(42);
  });

  it("carries the entry's own name and path through unchanged", () => {
    const entry = toEntryContext({ name: "accordion", path: entryPath });

    expect(entry.name).toBe("accordion");
    expect(entry.path).toBe(entryPath);
  });
});
