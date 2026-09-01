import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { hasFile } from "../../src/engine/predicates.js";

let entryPath: string;

beforeEach(() => {
  entryPath = mkdtempSync(join(tmpdir(), "probe-web-generators-predicates-"));
  mkdirSync(join(entryPath, "entity"), { recursive: true });
  writeFileSync(join(entryPath, "entity", "passport.ts"), "", "utf8");
});

afterEach(() => {
  rmSync(entryPath, { recursive: true, force: true });
});

describe("hasFile", () => {
  it("is true when the named file exists under the entry path", () => {
    expect(hasFile("entity/passport.ts")(entryPath)).toBe(true);
  });

  it("is false when the named file does not exist under the entry path", () => {
    expect(hasFile("entity/io.ts")(entryPath)).toBe(false);
  });
});
