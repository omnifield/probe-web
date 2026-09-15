import { describe, expect, it } from "vitest";

import { rules } from "../src/style/index.js";

describe("style canon", () => {
  it("замёрзший список, без дублей id", () => {
    expect(Object.isFrozen(rules)).toBe(true);
    const ids = rules.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("держит formatting и organized-imports обязательными — это ровно то, что переводит ./biome", () => {
    const byId = new Map(rules.map((rule) => [rule.id, rule]));
    expect(byId.get("formatting")?.severity).toBe("required");
    expect(byId.get("organized-imports")?.severity).toBe("required");
  });
});
