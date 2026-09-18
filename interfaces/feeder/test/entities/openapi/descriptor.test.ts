import { describe, expect, it } from "vitest";

import { descriptorToEndpoint } from "../../../src/entities/openapi/descriptor.js";
import { endpointDescriptorSchema, manualGroupSchema, type EndpointDescriptor } from "../../../src/entities/openapi/models/index.js";

describe("endpointDescriptorSchema / manualGroupSchema", () => {
  it("дескриптор без параметров валиден", () => {
    const descriptor: EndpointDescriptor = { method: "GET", url: "https://api/ping", params: [] };
    expect(endpointDescriptorSchema.parse(descriptor)).toEqual(descriptor);
  });

  it("группа-юзер — обёртка { endpoints } нужна Tree (объектный корень)", () => {
    const value = { endpoints: [{ method: "GET", url: "https://api/ping", params: [] }] };
    expect(manualGroupSchema.parse(value)).toEqual(value);
  });
});

describe("descriptorToEndpoint", () => {
  it("обязательный string-параметр — попадает в схему как обязательный", () => {
    const descriptor: EndpointDescriptor = {
      method: "GET",
      url: "https://api/pets/{petId}",
      params: [{ name: "petId", type: "string", required: true }],
    };
    const endpoint = descriptorToEndpoint(descriptor);

    expect(endpoint.method).toBe("GET");
    expect(endpoint.url).toBe("https://api/pets/{petId}");
    expect(endpoint.schema.parse({ petId: "42" })).toEqual({ petId: "42" });
    expect(() => endpoint.schema.parse({})).toThrow();
  });

  it("необязательный number-параметр — optional в схеме", () => {
    const descriptor: EndpointDescriptor = {
      method: "GET",
      url: "https://api/pets",
      params: [{ name: "limit", type: "number", required: false }],
    };
    const endpoint = descriptorToEndpoint(descriptor);

    expect(endpoint.schema.parse({})).toEqual({});
    expect(endpoint.schema.parse({ limit: 10 })).toEqual({ limit: 10 });
    expect(() => endpoint.schema.parse({ limit: "10" })).toThrow();
  });

  it("boolean-параметр и параметр body — та же схема, что и распознавание из свагера", () => {
    const descriptor: EndpointDescriptor = {
      method: "POST",
      url: "https://api/pets",
      params: [
        { name: "notify", type: "boolean", required: false },
        { name: "body", type: "string", required: true },
      ],
    };
    const endpoint = descriptorToEndpoint(descriptor);

    expect(endpoint.schema.parse({ notify: true, body: "{}" })).toEqual({ notify: true, body: "{}" });
    expect(() => endpoint.schema.parse({ notify: true })).toThrow();
  });
});
