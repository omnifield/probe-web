import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runScaffoldGeneration } from "../../src/scaffold/run.js";
import type { Entry } from "../../src/barrel/types.js";

let rootDir: string;

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), "probe-web-generators-scaffold-run-"));
});

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true });
});

function makeComponent(name: string): void {
  const entryDir = join(rootDir, name);
  mkdirSync(join(entryDir, "entity"), { recursive: true });
  writeFileSync(join(entryDir, "entity", "passport.ts"), "", "utf8");
}

describe("runScaffoldGeneration", () => {
  it("writes one file per entry, inside that entry's own directory", async () => {
    makeComponent("accordion");
    makeComponent("button");
    mkdirSync(join(rootDir, "shared"), { recursive: true }); // not a component: no marker file

    const written = await runScaffoldGeneration({
      rootDir,
      isEntry: (entryPath) => existsSync(join(entryPath, "entity", "passport.ts")),
      spec: {
        outputPathFor: (entry: Entry) => join(entry.path, "README.md"),
        collect: (entry: Entry) => entry,
        render: (entry: Entry) => `# ${entry.name}\n`,
      },
    });

    expect(written).toEqual([
      { path: join(rootDir, "accordion", "README.md"), content: "# accordion\n" },
      { path: join(rootDir, "button", "README.md"), content: "# button\n" },
    ]);
    expect(readFileSync(join(rootDir, "accordion", "README.md"), "utf8")).toBe("# accordion\n");
    expect(readFileSync(join(rootDir, "button", "README.md"), "utf8")).toBe("# button\n");
  });

  it("stops before writing any file when validate throws on one entry", async () => {
    makeComponent("accordion");
    makeComponent("button");

    await expect(
      runScaffoldGeneration({
        rootDir,
        isEntry: (entryPath) => existsSync(join(entryPath, "entity", "passport.ts")),
        spec: {
          outputPathFor: (entry: Entry) => join(entry.path, "README.md"),
          collect: (entry: Entry) => entry,
          validate: (_item, entry: Entry) => {
            if (entry.name === "button") throw new Error(`no data for: ${entry.name}`);
          },
          render: (entry: Entry) => `# ${entry.name}\n`,
        },
      }),
    ).rejects.toThrow("no data for: button");
    // "accordion" sorts before "button" and would already have been written
    // by a naive per-entry loop that writes as it goes — this engine
    // generates ALL files first and only then writes, so a later entry's
    // failure leaves nothing on disk, not a half-finished batch.
    expect(existsSync(join(rootDir, "accordion", "README.md"))).toBe(false);
  });
});
