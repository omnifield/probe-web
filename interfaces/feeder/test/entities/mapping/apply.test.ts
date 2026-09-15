import type { FieldRule } from "@web-core/io";
import { describe, expect, it } from "vitest";

import { applyMapping } from "../../../src/entities/mapping/apply.js";

describe("applyMapping", () => {
  it("простое 1:1 сведение — путь А в путь Б", () => {
    const rules: FieldRule[] = [{ target: "/label", from: "/name" }];

    const result = applyMapping({ id: "1", name: "Ada" }, rules);

    expect(result).toEqual({ row: { label: "Ada" }, issues: [] });
  });

  it("несуществующий путь-источник — поле пропускается (skip по умолчанию), не падает", () => {
    const rules: FieldRule[] = [{ target: "/label", from: "/missing" }];

    const result = applyMapping({ id: "1" }, rules);

    expect(result.row).toEqual({});
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.rule).toBe(rules[0]);
  });

  it("источник не объект (например, вариант А был дан просто схемой) — считается пустым, не падает", () => {
    const rules: FieldRule[] = [{ target: "/label", from: "/name" }];

    expect(applyMapping(undefined, rules).row).toEqual({});
    expect(applyMapping("строка", rules).row).toEqual({});
  });

  it("несколько правил сразу — каждое своим путём", () => {
    const rules: FieldRule[] = [
      { target: "/title", from: "/name" },
      { target: "/qty", from: "/count" },
    ];

    const result = applyMapping({ name: "Widget", count: 3 }, rules);

    expect(result).toEqual({ row: { title: "Widget", qty: 3 }, issues: [] });
  });
});
