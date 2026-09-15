import { z } from "@web-core/io";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OpenapiEndpoint } from "../../../src/entities/openapi/index.js";
import { invokeEndpoint } from "../../../src/features/invoke-endpoint/invoke.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function endpoint(overrides: Partial<OpenapiEndpoint> = {}): OpenapiEndpoint {
  return { method: "GET", url: "https://api.example/pet/{petId}", schema: z.object({}), ...overrides };
}

describe("invokeEndpoint", () => {
  it("path-параметр подставляется в url по имени плейсхолдера, остальные уходят в query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await invokeEndpoint(endpoint(), { petId: 42, verbose: true });

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.example/pet/42?verbose=true");
  });

  it("массив в query уходит повторяющимися парами key=value", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await invokeEndpoint(endpoint({ url: "https://api.example/pets" }), { status: ["available", "sold"] });

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.example/pets?status=available&status=sold");
  });

  it("body уходит JSON-телом, method берётся с ручки", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await invokeEndpoint(endpoint({ method: "POST", url: "https://api.example/pet" }), {
      body: { name: "doggie" },
    });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init).toMatchObject({ method: "POST", body: JSON.stringify({ name: "doggie" }) });
  });

  it("успешный ответ — { status, ok, body } из распарсенного JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 1, name: "doggie" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const result = await invokeEndpoint(endpoint({ url: "https://api.example/pet/1" }), { petId: 1 });

    expect(result).toEqual({
      status: 200,
      ok: true,
      headers: expect.objectContaining({ "content-type": "application/json" }),
      body: { id: 1, name: "doggie" },
    });
  });

  it("не-2xx — валидный результат (ok: false), не исключение", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const result = await invokeEndpoint(endpoint({ url: "https://api.example/pet/999" }), { petId: 999 });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ message: "not found" });
  });
});
