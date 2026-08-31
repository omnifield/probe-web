import { describe, expect, it } from "vitest";

import { generateBarrels } from "../../src/barrel/generate.js";
import type { BarrelSpec, Entry } from "../../src/barrel/types.js";

const entries: Entry[] = [
  { name: "accordion", path: "/kit/accordion" },
  { name: "button", path: "/kit/button" },
];

describe("generateBarrels", () => {
  it("renders one output file per spec, in spec order", async () => {
    const listNames: BarrelSpec<Entry> = {
      outputPath: "/out/names.ts",
      collect: (items) => items,
      render: (items) => items.map((entry) => entry.name).join(","),
    };
    const countEntries: BarrelSpec<Entry> = {
      outputPath: "/out/count.ts",
      collect: (items) => items,
      render: (items) => String(items.length),
    };

    const files = await generateBarrels(entries, [listNames, countEntries]);

    expect(files).toEqual([
      { path: "/out/names.ts", content: "accordion,button" },
      { path: "/out/count.ts", content: "2" },
    ]);
  });

  it("lets collect narrow the entry list per barrel", async () => {
    const onlyButton: BarrelSpec<Entry> = {
      outputPath: "/out/button-only.ts",
      collect: (items) => items.filter((entry) => entry.name === "button"),
      render: (items) => items.map((entry) => entry.name).join(","),
    };

    const [file] = await generateBarrels(entries, [onlyButton]);

    expect(file?.content).toBe("button");
  });

  it("runs validate before render and propagates a thrown error", async () => {
    const failing: BarrelSpec<Entry> = {
      outputPath: "/out/invalid.ts",
      collect: (items) => items,
      validate: (items) => {
        throw new Error(`missing marker file: ${items[0]?.name}`);
      },
      render: () => "unreachable",
    };

    await expect(generateBarrels(entries, [failing])).rejects.toThrow("missing marker file: accordion");
  });

  it("resolves an async collect/validate/render, in order", async () => {
    const asyncSpec: BarrelSpec<Entry> = {
      outputPath: "/out/async.ts",
      collect: async (items) => items,
      validate: async () => {
        /* no-op, but proves an async validate is awaited */
      },
      render: async (items) => items.map((entry) => entry.name).join(","),
    };

    const [file] = await generateBarrels(entries, [asyncSpec]);

    expect(file?.content).toBe("accordion,button");
  });
});
