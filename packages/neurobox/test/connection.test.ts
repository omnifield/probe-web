import { describe, expect, it, vi } from "vitest";
import type { RunAgentInputContext } from "@tanstack/ai-client";
import { createNeuroboxConnection } from "../src/engine/connection.js";

function sseResponse(lines: Array<string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(`data: ${line}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

async function collect<T>(iterable: AsyncIterable<T>): Promise<Array<T>> {
  const out: Array<T> = [];
  for await (const item of iterable) out.push(item);
  return out;
}

describe("createNeuroboxConnection", () => {
  it("routes data.context into the wire context field, keeps the rest as forwardedProps, sets access headers", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchClient = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return sseResponse([JSON.stringify({ type: "RUN_STARTED", threadId: "t1", runId: "r1" })]);
    });

    const connection = createNeuroboxConnection({
      baseUrl: "https://box.example",
      token: "secret-token",
      userLogin: () => "egor",
      fetchClient: fetchClient as unknown as typeof fetch,
    });

    const runContext: RunAgentInputContext = {
      threadId: "t1",
      runId: "r1",
      forwardedProps: { recipe: "сборка-скинов" },
    };

    const chunks = await collect(
      connection.connect(
        [{ id: "m1", role: "user", content: "сделай кнопку пошире" }],
        { context: [{ description: "component", value: "button" }], agent: "claude-code" },
        undefined,
        runContext,
      ),
    );

    expect(chunks).toEqual([{ type: "RUN_STARTED", threadId: "t1", runId: "r1" }]);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://box.example/api/agent");

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
    expect(headers["X-User-Login"]).toBe("egor");

    const body = JSON.parse(calls[0].init.body as string);
    expect(body.threadId).toBe("t1");
    expect(body.context).toEqual([{ description: "component", value: "button" }]);
    expect(body.forwardedProps).toEqual({ recipe: "сборка-скинов", agent: "claude-code" });
    expect(body.messages[0]).toMatchObject({ id: "m1", role: "user", content: "сделай кнопку пошире" });
  });

  it("defaults an absent context to an empty array rather than leaking it into forwardedProps", async () => {
    const fetchClient = vi.fn(async (_url: string, _init: RequestInit) => sseResponse([]));
    const connection = createNeuroboxConnection({
      token: "t",
      userLogin: "u",
      fetchClient: fetchClient as unknown as typeof fetch,
    });

    await collect(
      connection.connect([], { agent: "claude-code" }, undefined, { threadId: "t1", runId: "r1" }),
    );

    const [, init] = fetchClient.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.context).toEqual([]);
    expect(body.forwardedProps).toEqual({ agent: "claude-code" });
  });

  it("cancels through a fresh signal on abort, never the one that just fired", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    let resolveFirstFetchStarted!: () => void;
    const firstFetchStarted = new Promise<void>((resolve) => {
      resolveFirstFetchStarted = resolve;
    });

    const fetchClient = vi.fn(async (url: string, init: RequestInit) => {
      requests.push({ url, init });
      if (url.endsWith("/cancel")) return new Response(null, { status: 200 });
      resolveFirstFetchStarted();
      // Никогда не закрывается — прогон "ещё идёт", когда вызывающий код отменит его.
      return new Response(new ReadableStream<Uint8Array>({}), { status: 200 });
    });

    const connection = createNeuroboxConnection({
      baseUrl: "https://box.example",
      token: "t",
      userLogin: "u",
      fetchClient: fetchClient as unknown as typeof fetch,
    });

    const controller = new AbortController();
    const iterator = connection
      .connect([], {}, controller.signal, { threadId: "thread-x", runId: "run-x" })
      [Symbol.asyncIterator]();
    const pendingNext = iterator.next();

    await firstFetchStarted;
    controller.abort();
    await pendingNext.catch(() => undefined);

    await vi.waitFor(() => {
      expect(requests.some((request) => request.url.endsWith("/cancel"))).toBe(true);
    });

    const cancelRequest = requests.find((request) => request.url.endsWith("/cancel"));
    expect(cancelRequest?.url).toBe("https://box.example/api/agent/thread-x/cancel");
    expect(cancelRequest?.init.signal).not.toBe(controller.signal);
    expect((cancelRequest?.init.signal as AbortSignal).aborted).toBe(false);
  });

  it("encodes a threadId containing a slash in the /cancel path instead of letting it inject a segment", async () => {
    const requests: Array<string> = [];
    let resolveFirstFetchStarted!: () => void;
    const firstFetchStarted = new Promise<void>((resolve) => {
      resolveFirstFetchStarted = resolve;
    });

    const fetchClient = vi.fn(async (url: string, _init: RequestInit) => {
      requests.push(url);
      if (url.includes("/cancel")) return new Response(null, { status: 200 });
      resolveFirstFetchStarted();
      return new Response(new ReadableStream<Uint8Array>({}), { status: 200 });
    });

    const connection = createNeuroboxConnection({
      baseUrl: "https://box.example",
      token: "t",
      userLogin: "u",
      fetchClient: fetchClient as unknown as typeof fetch,
    });

    const controller = new AbortController();
    const iterator = connection
      .connect([], {}, controller.signal, { threadId: "sneaky/../other", runId: "r1" })
      [Symbol.asyncIterator]();
    const pendingNext = iterator.next();

    await firstFetchStarted;
    controller.abort();
    await pendingNext.catch(() => undefined);

    await vi.waitFor(() => {
      expect(requests.some((url) => url.includes("/cancel"))).toBe(true);
    });

    const cancelUrl = requests.find((url) => url.includes("/cancel"));
    expect(cancelUrl).toBe("https://box.example/api/agent/sneaky%2F..%2Fother/cancel");
  });
});
