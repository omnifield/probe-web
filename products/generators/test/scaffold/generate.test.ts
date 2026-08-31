import { describe, expect, it } from "vitest";

import { generateScaffoldFiles } from "../../src/scaffold/generate.js";
import type { ScaffoldSpec } from "../../src/scaffold/types.js";
import type { Entry } from "../../src/barrel/types.js";

const entries: Entry[] = [
  { name: "accordion", path: "/kit/accordion" },
  { name: "button", path: "/kit/button" },
];

describe("generateScaffoldFiles", () => {
  it("produces one file per entry, each from that entry alone", async () => {
    const spec: ScaffoldSpec<Entry> = {
      outputPathFor: (entry) => `${entry.path}/README.md`,
      collect: (entry) => entry,
      render: (entry) => `# ${entry.name}`,
    };

    const files = await generateScaffoldFiles(entries, spec);

    expect(files).toEqual([
      { path: "/kit/accordion/README.md", content: "# accordion" },
      { path: "/kit/button/README.md", content: "# button" },
    ]);
  });

  it("runs validate before render and propagates a thrown error, naming the entry", async () => {
    const spec: ScaffoldSpec<Entry> = {
      outputPathFor: (entry) => `${entry.path}/README.md`,
      collect: (entry) => entry,
      validate: (_item, entry) => {
        throw new Error(`missing data for: ${entry.name}`);
      },
      render: () => "unreachable",
    };

    await expect(generateScaffoldFiles(entries, spec)).rejects.toThrow("missing data for: accordion");
  });

  it("returns an empty list for an empty entry list, without calling render", async () => {
    let renderCalls = 0;
    const spec: ScaffoldSpec<Entry> = {
      outputPathFor: (entry) => `${entry.path}/README.md`,
      collect: (entry) => entry,
      render: () => {
        renderCalls += 1;
        return "unreachable";
      },
    };

    await expect(generateScaffoldFiles([], spec)).resolves.toEqual([]);
    expect(renderCalls).toBe(0);
  });

  it("resolves an async collect/validate/render, per entry", async () => {
    const spec: ScaffoldSpec<Entry> = {
      outputPathFor: (entry) => `${entry.path}/README.md`,
      collect: async (entry) => entry,
      validate: async () => {
        /* no-op, but proves an async validate is awaited */
      },
      render: async (entry) => `# ${entry.name}`,
    };

    const files = await generateScaffoldFiles(entries, spec);

    expect(files.map((file) => file.content)).toEqual(["# accordion", "# button"]);
  });
});
