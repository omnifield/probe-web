import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { writeGeneratedFiles } from "../../src/engine/write.js";

let rootDir: string;

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), "probe-web-generators-write-"));
});

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true });
});

describe("writeGeneratedFiles", () => {
  it("writes each file's content to its path", () => {
    const passportPath = join(rootDir, "passport.ts");
    const kitPath = join(rootDir, "kit.ts");

    writeGeneratedFiles([
      { path: passportPath, content: "export const passport = 1;\n" },
      { path: kitPath, content: "export const kit = 2;\n" },
    ]);

    expect(readFileSync(passportPath, "utf8")).toBe("export const passport = 1;\n");
    expect(readFileSync(kitPath, "utf8")).toBe("export const kit = 2;\n");
  });

  it("overwrites a file that already had content", () => {
    const outputPath = join(rootDir, "index.ts");
    writeGeneratedFiles([{ path: outputPath, content: "stale" }]);

    writeGeneratedFiles([{ path: outputPath, content: "fresh" }]);

    expect(readFileSync(outputPath, "utf8")).toBe("fresh");
  });

  it("does nothing when given an empty list", () => {
    expect(() => writeGeneratedFiles([])).not.toThrow();
  });
});
