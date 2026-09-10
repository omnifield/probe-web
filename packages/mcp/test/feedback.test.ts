import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedbackDown, FeedbackRefused, listFeedback, reportFeedback, resolveFeedback } from "../src/feedback";

const URL = "http://presets.test/graphql";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function operationOf(call: unknown): string {
  const init = call as RequestInit;
  const body = JSON.parse(String(init.body)) as { query: string };
  return (/^\s*(?:query|mutation)\s+(\w+)/.exec(body.query))?.[1] ?? "";
}

const ENTRY = {
  id: "1",
  savedAt: "2026-09-05T00:00:00Z",
  tool: "save_preset",
  action: "click",
  expected: null,
  actual: "миганием",
  sign: "issue",
  status: "open",
  at: "2026-09-05T00:00:00Z",
  resolvedAt: null,
  note: null,
};

describe("reportFeedback/listFeedback/resolveFeedback — зеркало трёх операций feedback.graphql", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reportFeedback() шлёт input как есть и отдаёт заявку из ответа", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { reportFeedback: ENTRY } }));

    const entry = await reportFeedback(URL, { tool: "save_preset", action: "click", actual: "миганием" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(operationOf(fetchMock.mock.calls[0]![1])).toBe("ReportFeedback");

    const body = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body)) as { variables: { input: unknown } };
    expect(body.variables.input).toEqual({ tool: "save_preset", action: "click", actual: "миганием" });
    expect(entry).toEqual(ENTRY);
  });

  it("listFeedback() без фильтра шлёт status/sign как undefined — служба отдаёт всё", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { feedback: [ENTRY] } }));

    const entries = await listFeedback(URL);

    expect(operationOf(fetchMock.mock.calls[0]![1])).toBe("ListFeedback");
    const body = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body)) as { variables: unknown };
    expect(body.variables).toEqual({ status: undefined, sign: undefined });
    expect(entries).toEqual([ENTRY]);
  });

  it("listFeedback() прокидывает status/sign как есть", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { feedback: [] } }));

    await listFeedback(URL, { status: "open", sign: "praise" });

    const body = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body)) as { variables: unknown };
    expect(body.variables).toEqual({ status: "open", sign: "praise" });
  });

  it("resolveFeedback() шлёт id и note, отдаёт обновлённую заявку", async () => {
    const resolved = { ...ENTRY, status: "resolved", resolvedAt: "2026-09-06T00:00:00Z", note: "починено" };
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { resolveFeedback: resolved } }));

    const entry = await resolveFeedback(URL, "1", "починено");

    expect(operationOf(fetchMock.mock.calls[0]![1])).toBe("ResolveFeedback");
    const body = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body)) as { variables: { id: unknown; note: unknown } };
    expect(body.variables).toEqual({ id: "1", note: "починено" });
    expect(entry).toEqual(resolved);
  });

  it("сетевой обрыв — FeedbackDown, не FeedbackRefused", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(listFeedback(URL)).rejects.toBeInstanceOf(FeedbackDown);
  });

  it("HTTP 500 — FeedbackDown", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { errors: [{ message: "внутренняя ошибка" }] }));

    await expect(listFeedback(URL)).rejects.toBeInstanceOf(FeedbackDown);
  });

  it("уже resolved — FeedbackRefused с текстом отказа бэка", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { errors: [{ message: 'presets: заявка "1" уже разобрана' }] }))
      .mockResolvedValueOnce(jsonResponse(200, { errors: [{ message: 'presets: заявка "1" уже разобрана' }] }));

    await expect(resolveFeedback(URL, "1")).rejects.toThrow(FeedbackRefused);
    await expect(resolveFeedback(URL, "1")).rejects.toThrow('presets: заявка "1" уже разобрана');
  });

  it("HTTP 400 без GraphQL-конверта — тоже FeedbackRefused, не FeedbackDown", async () => {
    fetchMock.mockResolvedValueOnce(new Response("bad request", { status: 400 }));

    await expect(listFeedback(URL)).rejects.toBeInstanceOf(FeedbackRefused);
  });
});
