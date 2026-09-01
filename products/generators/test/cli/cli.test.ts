import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runCli } from "../../src/cli.js";

const fixtureConfigPath = join(import.meta.dirname, "fixtures", "cli-config.ts");

let rootDir: string;

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), "probe-web-generators-cli-"));
  process.env.CLI_TEST_ROOT_DIR = rootDir;
});

afterEach(() => {
  delete process.env.CLI_TEST_ROOT_DIR;
  rmSync(rootDir, { recursive: true, force: true });
});

describe("runCli", () => {
  it("loads a TypeScript config file's default export and runs it", async () => {
    mkdirSync(join(rootDir, "a"));
    writeFileSync(join(rootDir, "a", "marker.txt"), "", "utf8");
    mkdirSync(join(rootDir, "b"));
    writeFileSync(join(rootDir, "b", "marker.txt"), "", "utf8");
    mkdirSync(join(rootDir, "shared")); // no marker.txt: not an entry

    const written = await runCli(fixtureConfigPath);

    const outputPath = join(rootDir, "list.txt");
    expect(written).toEqual([{ path: outputPath, content: "a,b" }]);
    expect(readFileSync(outputPath, "utf8")).toBe("a,b");
  });

  it("rejects a config file with no default export", async () => {
    const badConfigPath = join(rootDir, "bad-config.ts");
    writeFileSync(badConfigPath, "export const notDefault = 42;\n", "utf8");

    await expect(runCli(badConfigPath)).rejects.toThrow("must `export default defineConfig(");
  });
});
