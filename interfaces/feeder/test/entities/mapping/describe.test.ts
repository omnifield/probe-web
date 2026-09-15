import { describeSample, describeSchema, z } from "@web-core/io";
import { describe, expect, it } from "vitest";

import { describeVariant } from "../../../src/entities/mapping/describe.js";

describe("describeVariant", () => {
  it("сырые данные — та же форма, что describeSample напрямую", () => {
    const sample = { id: "1", name: "Ada", active: true };
    expect(describeVariant(sample)).toEqual(describeSample(sample));
    expect(describeVariant(sample)).toEqual(
      expect.arrayContaining([
        { path: "/id", type: "string" },
        { path: "/name", type: "string" },
        { path: "/active", type: "boolean" },
      ]),
    );
  });

  it("zod-схема — распознаётся по instanceof, та же форма, что describeSchema напрямую", () => {
    const schema = z.object({ label: z.string(), count: z.number() });
    expect(describeVariant(schema)).toEqual(describeSchema(schema));
    expect(describeVariant(schema)).toEqual(
      expect.arrayContaining([
        { path: "/label", type: "string" },
        { path: "/count", type: "number" },
      ]),
    );
  });
});
