import { describe, expect, it, vi } from "vitest";
import type { RunAgentInputContext } from "@tanstack/ai-client";
import { createNeuroboxConnection } from "../src/engine/connection.js";
import type { NeuroboxContextEntry } from "../src/engine/connection.js";

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

  it("throws instead of silently starting a new thread when threadId is missing", async () => {
    const fetchClient = vi.fn(async () => sseResponse([]));
    const connection = createNeuroboxConnection({
      token: "t",
      userLogin: "u",
      fetchClient: fetchClient as unknown as typeof fetch,
    });

    await expect(collect(connection.connect([], {}, undefined, { runId: "r1" } as RunAgentInputContext))).rejects.toThrow(
      /threadId/,
    );
    expect(fetchClient).not.toHaveBeenCalled();
  });

  it("types NeuroboxContextEntry.value as a string — the wire protocol never carries anything else", () => {
    // @ts-expect-error value must be a string — the wire protocol never carries anything else.
    const entry: NeuroboxContextEntry = { description: "count", value: 42 };
    void entry;
  });

  it("declares its own clientTools in tools[], never runContext.clientTools", async () => {
    const fetchClient = vi.fn(async (_url: string, _init: RequestInit) => sseResponse([]));
    const connection = createNeuroboxConnection({
      token: "t",
      userLogin: "u",
      fetchClient: fetchClient as unknown as typeof fetch,
      clientTools: [
        { name: "save_favorite", description: "избранное", parameters: { type: "object" }, execute: () => "ok" },
      ],
    });

    await collect(
      connection.connect([], {}, undefined, {
        threadId: "t1",
        runId: "r1",
        clientTools: [{ name: "some_tanstack_tool", description: "не должен попасть в конверт", parameters: {} }],
      }),
    );

    const [, init] = fetchClient.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.tools).toEqual([{ name: "save_favorite", description: "избранное", parameters: { type: "object" } }]);
  });

  it("delivers a client tool's result via POST /tool/{toolCallId}, not the standard ChatClient path, and keeps reading the same stream", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const encoder = new TextEncoder();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "TOOL_CALL_START", toolCallId: "call-1", toolCallName: "save_favorite" })}\n\n`));
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "TOOL_CALL_ARGS", toolCallId: "call-1", delta: '{"preset":' })}\n\n`));
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "TOOL_CALL_ARGS", toolCallId: "call-1", delta: '"кнопка-синяя"}' })}\n\n`));
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "TOOL_CALL_END", toolCallId: "call-1" })}\n\n`));
        controller = c;
      },
    });

    const fetchClient = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith("/tool/call-1")) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "TOOL_CALL_RESULT", toolCallId: "call-1", content: "done" })}\n\n`),
        );
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "RUN_FINISHED" })}\n\n`));
        controller.close();
        return new Response(null, { status: 200 });
      }
      return new Response(stream, { status: 200 });
    });

    const execute = vi.fn(async (args: unknown) => {
      expect(args).toEqual({ preset: "кнопка-синяя" });
      return "сохранено, теперь их 7";
    });

    const connection = createNeuroboxConnection({
      baseUrl: "https://box.example",
      token: "t",
      userLogin: "u",
      fetchClient: fetchClient as unknown as typeof fetch,
      clientTools: [{ name: "save_favorite", description: "избранное", parameters: {}, execute }],
    });

    const chunks = await collect(connection.connect([], {}, undefined, { threadId: "t1", runId: "r1" }));

    expect(execute).toHaveBeenCalledTimes(1);

    const toolCall = calls.find((call) => call.url.endsWith("/tool/call-1"));
    expect(toolCall?.url).toBe("https://box.example/api/agent/t1/tool/call-1");
    expect(JSON.parse(toolCall!.init.body as string)).toEqual({ content: "сохранено, теперь их 7", failed: false });

    expect((chunks as Array<{ type: string }>).map((chunk) => chunk.type)).toEqual([
      "TOOL_CALL_START",
      "TOOL_CALL_ARGS",
      "TOOL_CALL_ARGS",
      "TOOL_CALL_END",
      "TOOL_CALL_RESULT",
      "RUN_FINISHED",
    ]);
  });

  it("reports a failed client tool execution as failed: true, not a thrown error swallowed silently", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "TOOL_CALL_START", toolCallId: "call-1", toolCallName: "save_favorite" })}\n\n`));
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "TOOL_CALL_END", toolCallId: "call-1" })}\n\n`));
        c.close();
      },
    });

    const fetchClient = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith("/tool/call-1")) return new Response(null, { status: 200 });
      return new Response(stream, { status: 200 });
    });

    const connection = createNeuroboxConnection({
      baseUrl: "https://box.example",
      token: "t",
      userLogin: "u",
      fetchClient: fetchClient as unknown as typeof fetch,
      clientTools: [
        {
          name: "save_favorite",
          description: "избранное",
          parameters: {},
          execute: () => {
            throw new Error("localStorage недоступен");
          },
        },
      ],
    });

    await collect(connection.connect([], {}, undefined, { threadId: "t1", runId: "r1" }));

    const toolCall = calls.find((call) => call.url.endsWith("/tool/call-1"));
    expect(JSON.parse(toolCall!.init.body as string)).toEqual({ content: "localStorage недоступен", failed: true });
  });
});
