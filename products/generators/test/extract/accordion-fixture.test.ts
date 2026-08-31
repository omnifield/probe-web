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

  // io.ts extraction is blocked upstream, not by this tool: @omnifield/probe-web-io's `paths.ts`
  // imports `getValueByPointer` from `fast-json-patch`, which plain Node's ESM interop does not
  // expose as a named export (reproduced independently of `importModule` — plain
  // `node --input-type=module -e "import { input } from '.../packages/io/dist/index.js'"` fails
  // the exact same way). Vitest's own transform papers over it, which is why `packages/io`'s own
  // test suite stays green. A packages/io fix, not ours — tracked, not worked around here.
  it.skip("extracts the real io.ts Zod schema — blocked by a packages/io bug (fast-json-patch interop), not by importModule", async () => {
    const { input } = await importModule<{ readonly input: unknown }>(join(entityDir, "io.ts"));

    expect(input).toBeDefined();
  });
});
