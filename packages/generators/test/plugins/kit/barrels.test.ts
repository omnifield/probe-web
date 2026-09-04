import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defineConfig, hasFile, run } from "../../../src/engine/index.js";
import { kitBarrelPlugins } from "../../../src/plugins/kit/barrels.js";

const templatesDir = join(import.meta.dirname, "fixtures", "templates");

let rootDir: string;

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), "web-core-generators-kit-barrel-"));
});

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true });
});

function makeComponent(name: string, options: { kitFile?: "kit.tsx" | "kit.ts"; io?: boolean } = { kitFile: "kit.tsx" }): void {
  const entryDir = join(rootDir, name);
  mkdirSync(join(entryDir, "entity"), { recursive: true });
  mkdirSync(join(entryDir, "playground"), { recursive: true });
  writeFileSync(join(entryDir, "entity", "passport.ts"), "", "utf8");
  writeFileSync(join(entryDir, "playground", "index.ts"), "", "utf8");
  if (options.kitFile) {
    mkdirSync(join(entryDir, "components"), { recursive: true });
    writeFileSync(join(entryDir, "components", options.kitFile), "", "utf8");
  }
  if (options.io) {
    writeFileSync(join(entryDir, "entity", "io.ts"), "", "utf8");
  }
}

function runConfig(outputDir: string) {
  return run(
    defineConfig({
      rootDir,
      isEntry: hasFile("entity/passport.ts"),
      plugins: kitBarrelPlugins({ outputDir, templatesDir }),
    }),
  );
}

describe("kitBarrelPlugins", () => {
  it("writes all four barrels from real entries, .tsx and .ts kit files both recognized", async () => {
    makeComponent("accordion", { kitFile: "kit.tsx", io: true });
    makeComponent("button", { kitFile: "kit.ts" });

    const written = await runConfig(rootDir);

    expect(written.map((file) => file.path).sort()).toEqual(
      [join(rootDir, "passport.ts"), join(rootDir, "kit.ts"), join(rootDir, "io.ts"), join(rootDir, "index.ts")].sort(),
    );

    expect(readFileSync(join(rootDir, "passport.ts"), "utf8")).toBe(
      "accordionPassport:accordion/entity/passport.js accordionEditorInfo:accordion/playground/index.js\n" +
        "buttonPassport:button/entity/passport.js buttonEditorInfo:button/playground/index.js\n",
    );
    expect(readFileSync(join(rootDir, "kit.ts"), "utf8")).toBe(
      "accordion:accordionKit:accordion/components/kit.jsx\n" + "button:buttonKit:button/components/kit.js\n",
    );
    expect(readFileSync(join(rootDir, "index.ts"), "utf8")).toBe("accordion\n" + "button\n");
  });

  it("io.ts only lists entries that declared entity/io.ts", async () => {
    makeComponent("accordion", { kitFile: "kit.tsx", io: true });
    makeComponent("button", { kitFile: "kit.tsx" }); // no io

    await runConfig(rootDir);

    expect(readFileSync(join(rootDir, "io.ts"), "utf8")).toBe("accordionPassport:accordionIo:accordion/entity/io.js\n");
  });

  it("io.ts is empty (not skipped) when no entry declares entity/io.ts", async () => {
    makeComponent("accordion", { kitFile: "kit.tsx" });

    await runConfig(rootDir);

    expect(existsSync(join(rootDir, "io.ts"))).toBe(true);
    expect(readFileSync(join(rootDir, "io.ts"), "utf8")).toBe("");
  });

  it("throws, and writes nothing, when a component declared anatomy but no kit part map", async () => {
    makeComponent("accordion", { kitFile: "kit.tsx" });
    makeComponent("broken", { kitFile: undefined });

    await expect(runConfig(rootDir)).rejects.toThrow("паспорт есть, карты нет — папки без карты частей: broken");

    // passportPlugin ran (it's first) and would have written passport.ts had run() not aborted —
    // the point of this assertion is that it did NOT: no partial output survives a failed run.
    expect(existsSync(join(rootDir, "passport.ts"))).toBe(false);
    expect(existsSync(join(rootDir, "kit.ts"))).toBe(false);
  });

  it("throws when the scanned root has no component at all", async () => {
    mkdirSync(join(rootDir, "not-a-component"), { recursive: true }); // no entity/passport.ts

    await expect(runConfig(rootDir)).rejects.toThrow("в `src/` нет ни одной папки компонента с анатомией");
  });
});
