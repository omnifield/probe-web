import { describe, expect, it, vi } from "vitest";
import { sendNeuroboxFeedback } from "../src/engine/feedback.js";

describe("sendNeuroboxFeedback", () => {
  it("POSTs kind/what/where/workaround with access headers", async () => {
    const fetchClient = vi.fn(
      async (_url: string, _init: RequestInit) => new Response(null, { status: 200 }),
    );

    await sendNeuroboxFeedback(
      "сеанс-работы-42",
      { kind: "friction", what: "рецепт не дал нужной ручки", where: "showcase", workaround: "написал вручную" },
      { baseUrl: "https://box.example", token: "t", userLogin: () => "egor", fetchClient: fetchClient as unknown as typeof fetch },
    );

    expect(fetchClient).toHaveBeenCalledTimes(1);
    const [url, init] = fetchClient.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://box.example/api/feedback/сеанс-работы-42");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer t");
    expect(headers["X-User-Login"]).toBe("egor");
    expect(JSON.parse(init.body as string)).toEqual({
      kind: "friction",
      what: "рецепт не дал нужной ручки",
      where: "showcase",
      workaround: "написал вручную",
    });
  });

  it("accepts praise without a workaround", async () => {
    const fetchClient = vi.fn(async () => new Response(null, { status: 200 }));

    await sendNeuroboxFeedback(
      "t1",
      { kind: "praise", what: "рецепт нашёлся сразу", where: "showcase" },
      { token: "t", userLogin: "u", fetchClient: fetchClient as unknown as typeof fetch },
    );

    expect(fetchClient).toHaveBeenCalledTimes(1);
  });

  it("throws on a non-ok response", async () => {
    const fetchClient = vi.fn(async () => new Response(null, { status: 401 }));

    await expect(
      sendNeuroboxFeedback(
        "t1",
        { kind: "friction", what: "x", where: "y" },
        { token: "t", userLogin: "u", fetchClient: fetchClient as unknown as typeof fetch },
      ),
    ).rejects.toThrow(/401/);
  });
});
