import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { discoverEntries } from "../../src/engine/scan.js";

let rootDir: string;

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), "probe-web-generators-scan-"));
});

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true });
});

function makeEntry(name: string, markerFile?: string): void {
  const entryPath = join(rootDir, name);
  mkdirSync(entryPath, { recursive: true });
  if (markerFile) {
    writeFileSync(join(entryPath, markerFile), "", "utf8");
  }
}

describe("discoverEntries", () => {
  it("returns only directories where isEntry matches", () => {
    makeEntry("accordion", "marker.txt");
    makeEntry("shared"); // no marker file: not an entry

    const entries = discoverEntries(rootDir, {
      isEntry: (entryPath) => existsSync(join(entryPath, "marker.txt")),
    });

    expect(entries.map((entry) => entry.name)).toEqual(["accordion"]);
  });

  it("ignores plain files sitting next to entry directories", () => {
    makeEntry("button", "marker.txt");
    writeFileSync(join(rootDir, "README.md"), "", "utf8");

    const entries = discoverEntries(rootDir, { isEntry: () => true });

    expect(entries.map((entry) => entry.name)).toEqual(["button"]);
  });

  it("sorts entries by name regardless of directory read order", () => {
    makeEntry("toggle", "marker.txt");
    makeEntry("accordion", "marker.txt");
    makeEntry("menu", "marker.txt");

    const entries = discoverEntries(rootDir, { isEntry: () => true });

    expect(entries.map((entry) => entry.name)).toEqual(["accordion", "menu", "toggle"]);
  });

  it("returns an empty list when nothing matches", () => {
    makeEntry("shared");

    const entries = discoverEntries(rootDir, { isEntry: () => false });

    expect(entries).toEqual([]);
  });
});
