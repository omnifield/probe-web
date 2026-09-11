import { describe, expect, it } from "vitest";

import { run } from "../../src/mapping/runner.js";
import type { MappingTemplate } from "../../src/mapping/types.js";

describe("run", () => {
  it("dispatches to the first template whose isEntry matches, and calls no other template", async () => {
    const calls: string[] = [];

    const notMine: MappingTemplate<string, string> = {
      name: "not-mine",
      isEntry: () => false,
      collect: () => {
        calls.push("not-mine.collect");
        return ["x"];
      },
      render: () => {
        calls.push("not-mine.render");
        return "unreachable";
      },
    };
    const mine: MappingTemplate<string, string> = {
      name: "mine",
      isEntry: (raw) => raw.startsWith("swagger:"),
      collect: (raw) => {
        calls.push("mine.collect");
        return [raw.slice("swagger:".length)];
      },
      render: (items) => {
        calls.push("mine.render");
        return items.join(",");
      },
    };
    const alsoMatches: MappingTemplate<string, string> = {
      name: "also-matches",
      isEntry: () => true,
      collect: () => {
        calls.push("also-matches.collect");
        return ["y"];
      },
      render: () => {
        calls.push("also-matches.render");
        return "unreachable";
      },
    };

    const result = await run("swagger:paths", [notMine, mine, alsoMatches]);

    expect(result).toBe("paths");
    expect(calls).toEqual(["mine.collect", "mine.render"]);
  });

  it("runs collect, then validate, then render, in that order", async () => {
    const calls: string[] = [];

    const template: MappingTemplate<string, string> = {
      name: "ordered",
      isEntry: () => true,
      collect: () => {
        calls.push("collect");
        return ["a", "b"];
      },
      validate: (items) => {
        calls.push("validate");
        expect(items).toEqual(["a", "b"]);
      },
      render: (items) => {
        calls.push("render");
        return items.join("+");
      },
    };

    const result = await run("raw", [template]);

    expect(calls).toEqual(["collect", "validate", "render"]);
    expect(result).toBe("a+b");
  });

  it("stops before render when validate throws", async () => {
    let renderCalled = false;

    const template: MappingTemplate<string, string> = {
      name: "invalid",
      isEntry: () => true,
      collect: () => ["a"],
      validate: () => {
        throw new Error("no endpoint mapping for: a");
      },
      render: () => {
        renderCalled = true;
        return "unreachable";
      },
    };

    await expect(run("raw", [template])).rejects.toThrow("no endpoint mapping for: a");
    expect(renderCalled).toBe(false);
  });

  it("throws an explicit error naming the tried templates when none of them recognize the input", async () => {
    const swagger2: MappingTemplate = { name: "swagger-2.0", isEntry: () => false, collect: () => [], render: () => undefined };
    const openapi3: MappingTemplate = { name: "openapi-3.0", isEntry: () => false, collect: () => [], render: () => undefined };

    await expect(run("not a known dialect", [swagger2, openapi3])).rejects.toThrow(/swagger-2\.0, openapi-3\.0/);
  });

  it("throws when there are no templates registered at all", async () => {
    await expect(run("raw", [])).rejects.toThrow("mapping.run: none of the templates recognize this input");
  });
});
