import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  endpointsAtom,
  importOpenApiDocument,
  servicesAtom,
} from "#/entities/openapi";
import { swagger2Template } from "#/entities/openapi/model/import/swagger2";

const testDir = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(
  join(
    testDir,
    "../src/entities/openapi/model/sources/swagger_example_v2.0.yaml",
  ),
  "utf8",
);

describe("swagger2Template", () => {
  it('узнаёт Swagger 2.0 (swagger: "2.0")', () => {
    expect(swagger2Template.isEntry(fixture)).toBe(true);
  });

  it("не узнаёт OpenAPI 3.x — другое поле версии", () => {
    expect(swagger2Template.isEntry('{"openapi":"3.0.0","paths":{}}')).toBe(
      false,
    );
  });

  it("не узнаёт мусор", () => {
    expect(swagger2Template.isEntry("не спека вообще")).toBe(false);
  });
});

describe("importOpenApiDocument", () => {
  it("заводит сервис по info.title и по одной ручке на каждую операцию с поддерживаемым методом", async () => {
    const before = servicesAtom.get().length;

    const service = await importOpenApiDocument(fixture);

    expect(service.name).toBe("Swagger Petstore");
    expect(servicesAtom.get().length).toBe(before + 1);

    const endpoints = endpointsAtom
      .get()
      .filter((endpoint) => endpoint.serviceId === service.id);
    expect(endpoints).toHaveLength(20);
    expect(
      endpoints.every((endpoint) =>
        endpoint.url.startsWith("https://petstore.swagger.io/v2"),
      ),
    ).toBe(true);

    const addPet = endpoints.find(
      (endpoint) => endpoint.method === "POST" && endpoint.url.endsWith("/pet"),
    );
    expect(addPet?.tag).toBe("pet");
  });

  it("диалект не распознан ни одним шаблоном — сервис не заводится, explicit throw", async () => {
    const before = servicesAtom.get().length;

    await expect(
      importOpenApiDocument('{"openapi":"3.0.0","paths":{}}'),
    ).rejects.toThrow(/none of the templates recognize/);
    expect(servicesAtom.get().length).toBe(before);
  });
});
