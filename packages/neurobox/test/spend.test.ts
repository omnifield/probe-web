import { describe, expect, it, vi } from "vitest";
import { fetchNeuroboxSpend } from "../src/engine/spend.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchNeuroboxSpend", () => {
  it("GETs the snapshot as-is, with access headers, no delta computed", async () => {
    const snapshot = {
      thread: "сеанс-работы-42",
      runs: 7,
      prompt_tokens: 96,
      completion_tokens: 21397,
      cache_read_tokens: 1152848,
      cost_micros: 2900000,
    };
    const fetchClient = vi.fn(async (_url: string, _init: RequestInit) => jsonResponse(snapshot));

    const result = await fetchNeuroboxSpend("сеанс-работы-42", {
      baseUrl: "https://box.example",
      token: "t",
      userLogin: () => "egor",
      fetchClient: fetchClient as unknown as typeof fetch,
    });

    expect(result).toEqual(snapshot);
    const [url, init] = fetchClient.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://box.example/api/agent/${encodeURIComponent("сеанс-работы-42")}/spent`);
    expect(init.method).toBe("GET");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer t");
    expect(headers["X-User-Login"]).toBe("egor");
  });

  it("throws on a non-ok response instead of returning a partial snapshot", async () => {
    const fetchClient = vi.fn(async () => jsonResponse({ error: "not-probed" }, 404));

    await expect(
      fetchNeuroboxSpend("unknown-thread", {
        token: "t",
        userLogin: "u",
        fetchClient: fetchClient as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/404/);
  });
});
