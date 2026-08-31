import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { identifierFromEntryName } from "../../src/barrel/identifier.js";
import { runBarrelGeneration } from "../../src/barrel/run.js";
import type { Entry } from "../../src/barrel/types.js";

let rootDir: string;

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), "probe-web-generators-run-"));
});

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true });
});

function makeComponent(name: string): void {
  const entryDir = join(rootDir, name);
  mkdirSync(join(entryDir, "entity"), { recursive: true });
  writeFileSync(join(entryDir, "entity", "passport.ts"), "", "utf8");
}

describe("runBarrelGeneration", () => {
  it("scans, renders, and writes a barrel end to end", async () => {
    makeComponent("accordion");
    makeComponent("button");
    mkdirSync(join(rootDir, "shared"), { recursive: true }); // not a component: no marker file

    const outputPath = join(rootDir, "passport.ts");

    const written = await runBarrelGeneration({
      rootDir,
      isEntry: (entryPath) => existsSync(join(entryPath, "entity", "passport.ts")),
      specs: [
        {
          outputPath,
          collect: (entries: readonly Entry[]) => entries,
          render: (entries: readonly Entry[]) =>
            entries
              .map((entry) => `export * from "./${entry.name}/entity/passport.js"; // ${identifierFromEntryName(entry.name, "Passport")}`)
              .join("\n"),
        },
      ],
    });

    expect(written).toEqual([
      {
        path: outputPath,
        content:
          'export * from "./accordion/entity/passport.js"; // accordionPassport\n' +
          'export * from "./button/entity/passport.js"; // buttonPassport',
      },
    ]);
    expect(readFileSync(outputPath, "utf8")).toBe(written[0]?.content);
  });

  it("produces an empty barrel when no entry matches, without touching disk for it", async () => {
    mkdirSync(join(rootDir, "shared"), { recursive: true });

    const outputPath = join(rootDir, "passport.ts");

    const written = await runBarrelGeneration({
      rootDir,
      isEntry: (entryPath) => existsSync(join(entryPath, "entity", "passport.ts")),
      specs: [
        {
          outputPath,
          collect: (entries: readonly Entry[]) => entries,
          render: (entries: readonly Entry[]) => entries.map((entry) => entry.name).join(","),
        },
      ],
    });

    expect(written).toEqual([{ path: outputPath, content: "" }]);
  });

  it("stops before writing when a spec's validate throws", async () => {
    makeComponent("accordion");
    const outputPath = join(rootDir, "kit.ts");

    await expect(
      runBarrelGeneration({
        rootDir,
        isEntry: (entryPath) => existsSync(join(entryPath, "entity", "passport.ts")),
        specs: [
          {
            outputPath,
            collect: (entries: readonly Entry[]) => entries,
            validate: (entries: readonly Entry[]) => {
              throw new Error(`no kit map for: ${entries.map((entry) => entry.name).join(", ")}`);
            },
            render: () => "unreachable",
          },
        ],
      }),
    ).rejects.toThrow("no kit map for: accordion");
    expect(existsSync(outputPath)).toBe(false);
  });
});
