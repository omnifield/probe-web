import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { hasFile } from "../../src/plugin/predicates.js";
import { defineConfig, run } from "../../src/plugin/runner.js";
import type { AggregatePlugin, PerEntryPlugin } from "../../src/plugin/types.js";

let rootDir: string;

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), "probe-web-generators-plugin-run-"));
});

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true });
});

function makeComponent(name: string, options: { io?: boolean } = {}): void {
  const entryDir = join(rootDir, name);
  mkdirSync(join(entryDir, "entity"), { recursive: true });
  writeFileSync(join(entryDir, "entity", "passport.ts"), "", "utf8");
  if (options.io) writeFileSync(join(entryDir, "entity", "io.ts"), "", "utf8");
}

describe("defineConfig", () => {
  it("returns the config unchanged — a typing aid, not a transform", () => {
    const config = defineConfig({ rootDir, isEntry: hasFile("entity/passport.ts"), plugins: [] });

    expect(config).toEqual({ rootDir, isEntry: expect.any(Function), plugins: [] });
  });
});

describe("run", () => {
  it("runs an aggregate plugin against every entry the root scan finds", async () => {
    makeComponent("accordion");
    makeComponent("button");
    mkdirSync(join(rootDir, "shared"), { recursive: true }); // not a component: no marker file

    const outputPath = join(rootDir, "index.ts");
    const indexPlugin: AggregatePlugin<string> = {
      name: "index",
      output: outputPath,
      collect: (entries) => entries.map((entry) => entry.name),
      render: (names) => names.map((name) => `export * from "./${name}/index.js";`).join("\n"),
    };

    const written = await run(defineConfig({ rootDir, isEntry: hasFile("entity/passport.ts"), plugins: [indexPlugin] }));

    expect(written).toEqual([{ path: outputPath, content: 'export * from "./accordion/index.js";\nexport * from "./button/index.js";' }]);
    expect(readFileSync(outputPath, "utf8")).toBe(written[0]?.content);
  });

  it("runs a per-entry plugin once per entry, using EntryContext.resolve for the output path", async () => {
    makeComponent("accordion");
    makeComponent("button");

    const readmePlugin: PerEntryPlugin<{ name: string }> = {
      name: "readme",
      outputFor: (entry) => entry.resolve("README.md"),
      collect: (entry) => ({ name: entry.name }),
      render: (item) => `# ${item.name}\n`,
    };

    const written = await run(defineConfig({ rootDir, isEntry: hasFile("entity/passport.ts"), plugins: [readmePlugin] }));

    expect(written).toEqual([
      { path: join(rootDir, "accordion", "README.md"), content: "# accordion\n" },
      { path: join(rootDir, "button", "README.md"), content: "# button\n" },
    ]);
  });

  it("narrows a plugin's own entries with its isEntry, independent of the root scan", async () => {
    makeComponent("accordion", { io: true });
    makeComponent("button"); // no entity/io.ts

    const ioPlugin: AggregatePlugin<string> = {
      name: "io",
      output: join(rootDir, "io.ts"),
      isEntry: (entry) => entry.has("entity/io.ts"),
      collect: (entries) => entries.map((entry) => entry.name),
      render: (names) => names.join(","),
    };

    const written = await run(defineConfig({ rootDir, isEntry: hasFile("entity/passport.ts"), plugins: [ioPlugin] }));

    expect(written).toEqual([{ path: join(rootDir, "io.ts"), content: "accordion" }]);
  });

  it("keeps a hand-written zone across a second run, using each plugin's own placeholder on the first", async () => {
    makeComponent("accordion");
    const outputPath = join(rootDir, "accordion", "README.md");

    const readmePlugin: PerEntryPlugin<{ name: string }> = {
      name: "readme",
      outputFor: (entry) => entry.resolve("README.md"),
      collect: (entry) => ({ name: entry.name }),
      render: (item) => `# ${item.name}\n\n<!-- gen:notes:start -->\nTODO\n<!-- gen:notes:end -->\n`,
      zones: ["notes"],
    };
    const config = defineConfig({ rootDir, isEntry: hasFile("entity/passport.ts"), plugins: [readmePlugin] });

    await run(config);
    expect(readFileSync(outputPath, "utf8")).toContain("TODO");

    const withHandWritten = readFileSync(outputPath, "utf8").replace("TODO", "A human wrote this.");
    writeFileSync(outputPath, withHandWritten, "utf8");

    await run(config);

    const final = readFileSync(outputPath, "utf8");
    expect(final).toContain("A human wrote this.");
    expect(final).not.toContain("TODO");
    expect(final.startsWith("# accordion\n")).toBe(true);
  });

  it("calls a plugin's setup exactly once, before any entry is collected", async () => {
    makeComponent("accordion");
    makeComponent("button");
    let setupCalls = 0;
    let collectCallsBeforeSetupResolved = 0;

    const plugin: AggregatePlugin<string> = {
      name: "counted",
      output: join(rootDir, "out.ts"),
      setup: () => {
        setupCalls += 1;
      },
      collect: (entries) => {
        collectCallsBeforeSetupResolved = setupCalls;
        return entries.map((entry) => entry.name);
      },
      render: (names) => names.join(","),
    };

    await run(defineConfig({ rootDir, isEntry: hasFile("entity/passport.ts"), plugins: [plugin] }));

    expect(setupCalls).toBe(1);
    expect(collectCallsBeforeSetupResolved).toBe(1);
  });

  it("stops before writing when a plugin's validate throws", async () => {
    makeComponent("accordion");
    const outputPath = join(rootDir, "kit.ts");

    const plugin: AggregatePlugin<string> = {
      name: "kit",
      output: outputPath,
      collect: (entries) => entries.map((entry) => entry.name),
      validate: (names) => {
        throw new Error(`no kit map for: ${names.join(", ")}`);
      },
      render: () => "unreachable",
    };

    await expect(run(defineConfig({ rootDir, isEntry: hasFile("entity/passport.ts"), plugins: [plugin] }))).rejects.toThrow(
      "no kit map for: accordion",
    );
    expect(existsSync(outputPath)).toBe(false);
  });
});
