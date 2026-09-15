import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { run } from "@web-core/generators/mapping";
import { describe, expect, it } from "vitest";

import { swagger2Template } from "../../../src/entities/openapi/swagger2.js";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(join(fixtureDir, "fixtures/petstore.yaml"), "utf-8");

describe("swagger2Template.isEntry", () => {
  it("распознаёт документ с swagger: \"2.0\"", () => {
    expect(swagger2Template.isEntry(petstore)).toBe(true);
  });

  it("не распознаёт произвольный текст", () => {
    expect(swagger2Template.isEntry("hello")).toBe(false);
  });

  it("не распознаёт валидный YAML без swagger: \"2.0\"", () => {
    expect(swagger2Template.isEntry("openapi: 3.0.0")).toBe(false);
  });
});

describe("run(raw, [swagger2Template])", () => {
  it("отклоняет источник, который не распознал ни один шаблон", async () => {
    await expect(run("не свагер", [swagger2Template])).rejects.toThrow(/none of the templates recognize/);
  });

  it("собирает все три ручки с методом/url/тегом", async () => {
    const endpoints = await run(petstore, [swagger2Template]);

    expect(endpoints).toHaveLength(3);
    expect(endpoints.map((endpoint) => `${endpoint.method} ${endpoint.url}`)).toEqual(
      expect.arrayContaining([
        "POST https://petstore.swagger.io/v2/pet",
        "GET https://petstore.swagger.io/v2/pet/findByStatus",
        "GET https://petstore.swagger.io/v2/pet/{petId}",
      ]),
    );
    for (const endpoint of endpoints) expect(endpoint.tag).toBe("pet");
  });

  it("query-параметр массив+enum — обязательный, элементы только из enum", async () => {
    const endpoints = await run(petstore, [swagger2Template]);
    const findByStatus = endpoints.find((endpoint) => endpoint.url.endsWith("/findByStatus"))!;

    expect(findByStatus.schema.parse({ status: ["available", "sold"] })).toEqual({ status: ["available", "sold"] });
    expect(() => findByStatus.schema.parse({ status: ["not-a-status"] })).toThrow();
    expect(() => findByStatus.schema.parse({})).toThrow();
  });

  it("path-параметр integer — обязательное число", async () => {
    const endpoints = await run(petstore, [swagger2Template]);
    const getById = endpoints.find((endpoint) => endpoint.url.endsWith("/{petId}"))!;

    expect(getById.schema.parse({ petId: 42 })).toEqual({ petId: 42 });
    expect(() => getById.schema.parse({ petId: "42" })).toThrow();
  });

  it("body-параметр с вложенным $ref (Category) и массивом $ref (Tag[]) резолвится целиком", async () => {
    const endpoints = await run(petstore, [swagger2Template]);
    const addPet = endpoints.find((endpoint) => endpoint.method === "POST")!;

    const value = {
      body: {
        name: "doggie",
        category: { id: 1, name: "dogs" },
        tags: [{ id: 1, name: "friendly" }],
        status: "available",
      },
    };
    expect(addPet.schema.parse(value)).toEqual(value);

    // required: ["name"] у Pet — без имени body невалиден
    expect(() => addPet.schema.parse({ body: { category: { id: 1, name: "dogs" } } })).toThrow();
  });
});
