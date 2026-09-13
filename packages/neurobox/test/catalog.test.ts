import { describe, expect, it, vi } from "vitest";
import {
  fetchNeuroboxAgents,
  fetchNeuroboxHealth,
  fetchNeuroboxMcpServers,
  fetchNeuroboxPassports,
  fetchNeuroboxRecipes,
  fetchNeuroboxRefusals,
  fetchNeuroboxSeeds,
} from "../src/engine/catalog.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("neurobox catalog endpoints", () => {
  it.each([
    ["/api/catalog/recipes", fetchNeuroboxRecipes],
    ["/api/catalog/passports", fetchNeuroboxPassports],
    ["/api/agents", fetchNeuroboxAgents],
    ["/api/catalog/seeds", fetchNeuroboxSeeds],
    ["/api/catalog/refusals", fetchNeuroboxRefusals],
    ["/api/mcp/servers", fetchNeuroboxMcpServers],
  ] as const)("GETs %s with access headers and returns the raw body", async (path, fetchFn) => {
    const payload = { items: ["x"] };
    const fetchClient = vi.fn(async (_url: string, _init: RequestInit) => jsonResponse(payload));

    const result = await fetchFn({
      baseUrl: "https://box.example",
      token: "t",
      userLogin: () => "egor",
      fetchClient: fetchClient as unknown as typeof fetch,
    });

    expect(result).toEqual(payload);
    const [url, init] = fetchClient.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://box.example${path}`);
    expect(init.method).toBe("GET");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer t");
    expect(headers["X-User-Login"]).toBe("egor");
  });

  it("throws on a non-ok response instead of returning a raw error body", async () => {
    const fetchClient = vi.fn(async () => jsonResponse({ error: "not-probed" }, 400));

    await expect(
      fetchNeuroboxRecipes({ token: "t", userLogin: "u", fetchClient: fetchClient as unknown as typeof fetch }),
    ).rejects.toThrow(/400/);
  });

  it("health check sends no access headers", async () => {
    const fetchClient = vi.fn(async (_url: string, _init: RequestInit) => jsonResponse({ ok: true }));

    const result = await fetchNeuroboxHealth({
      baseUrl: "https://box.example",
      fetchClient: fetchClient as unknown as typeof fetch,
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchClient.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://box.example/api/health");
    expect(init.headers).toEqual({});
  });
});
