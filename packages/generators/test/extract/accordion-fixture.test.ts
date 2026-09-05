import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { importModule } from "../../src/extract/module.js";

const entityDir = join(import.meta.dirname, "..", "fixtures", "accordion", "entity");

interface PassportModuleShape {
  readonly passport: {
    readonly parts: ReadonlyArray<{ readonly name: string }>;
    readonly settings: Readonly<Record<string, unknown>>;
  };
}

describe("importModule against a real component (copied accordion/entity, not synthetic)", () => {
  it("extracts the real passport built by definePassport — part names, not a static guess", async () => {
    const { passport } = await importModule<PassportModuleShape>(join(entityDir, "passport.ts"));

    expect(passport.parts.map((part) => part.name)).toEqual(["root", "item", "itemTrigger", "itemContent", "itemIndicator"]);
    expect(Object.keys(passport.settings)).toEqual(["orientation", "multiple", "collapsible"]);
  });

  it("extracts the real io.ts Zod schema once the CJS dependency is marked noExternal", async () => {
    const { input } = await importModule<{ readonly input: unknown }>(join(entityDir, "io.ts"), {
      ssr: { noExternal: ["fast-json-patch"] },
    });

    expect(input).toBeDefined();
  });
});
