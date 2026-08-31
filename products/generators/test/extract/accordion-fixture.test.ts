import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { importModule } from "../../src/extract/module.js";

const entityDir = join(import.meta.dirname, "..", "fixtures", "accordion", "entity");

// Deliberately NOT `typeof import("../fixtures/.../passport.js")`: that would pull the fixture's
// own type graph into THIS package's `tsc` program despite `test/fixtures` being excluded
// (`tsconfig.json`) — an explicit type-only import reaches in regardless of `exclude`, and the
// fixture references a type (`AccordionProps`) this package never copied in on purpose. A minimal
// local shape, just what the test reads, keeps the fixture truly foreign.
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

  // `fast-json-patch` (under @omnifield/probe-web-io's `paths.ts`) is CommonJS with no `exports`
  // map — plain Node's ESM interop, and this tool's default headless mode, both fail to find its
  // named exports (see extract/README's "Second argument" section). `ssr.noExternal` fixes it:
  // proof this is a caller-suppliable escape hatch, not a packages/io bug.
  it("extracts the real io.ts Zod schema once the CJS dependency is marked noExternal", async () => {
    const { input } = await importModule<{ readonly input: unknown }>(join(entityDir, "io.ts"), {
      ssr: { noExternal: ["fast-json-patch"] },
    });

    expect(input).toBeDefined();
  });
});
