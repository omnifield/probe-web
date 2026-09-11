import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createMutation, createQuery, QueryClient, QueryClientProvider } from "../src/index.js";
import { createRestClient, HTTPError, restRequest } from "../src/rest/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

function mountWithClient(code: () => unknown): HTMLElement {
  const client = new QueryClient();
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <QueryClientProvider client={client}>{code() as never}</QueryClientProvider>, host);
  return host;
}

describe("@web-core/query/rest", () => {
  it("restRequest подставляется как queryFn и доезжает до реального рендера", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ title: "hi" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    function Todo() {
      const query = createQuery(() => ({
        queryKey: ["todo", 1],
        queryFn: () => restRequest<{ title: string }>("https://api.example/todos/1"),
      }));
      return <p>{query.isPending ? "loading" : query.data?.title}</p>;
    }

    const host = mountWithClient(() => <Todo />);
    expect(host.textContent).toBe("loading");

    await vi.waitFor(() => expect(host.textContent).toBe("hi"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("json-шорткат сериализует тело и подставляется как mutationFn", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    function Save() {
      const mutation = createMutation(() => ({
        mutationFn: (title: string) =>
          restRequest("https://api.example/todos", { method: "POST", json: { title } }),
      }));
      return (
        <button type="button" onClick={() => mutation.mutate("buy milk")}>
          {mutation.isSuccess ? "saved" : "save"}
        </button>
      );
    }

    const host = mountWithClient(() => <Save />);
    host.querySelector("button")!.click();
    await vi.waitFor(() => expect(host.textContent).toBe("saved"));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect((init.headers as Headers).get("content-type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ title: "buy milk" }));
  });

  it("не-2xx кидает HTTPError с ответом и разобранным телом", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "not found" }), {
        status: 404,
        statusText: "Not Found",
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(restRequest("https://api.example/todos/999")).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(HTTPError);
      const httpError = error as HTTPError;
      expect(httpError.response.status).toBe(404);
      expect(httpError.data).toEqual({ message: "not found" });
      return true;
    });
  });

  it("createRestClient конфигурируется один раз, baseUrl/headers не повторяются на вызов, per-call headers перекрывают клиентские", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ title: "hi" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = createRestClient({
      baseUrl: "https://api.example/",
      headers: { authorization: "Bearer t", "x-app": "web-core" },
    });

    function Todo() {
      const query = createQuery(() => ({
        queryKey: ["todo", 1],
        queryFn: () => api.request<{ title: string }>("/todos/1", { headers: { "x-app": "override" } }),
      }));
      return <p>{query.isPending ? "loading" : query.data?.title}</p>;
    }

    const host = mountWithClient(() => <Todo />);
    await vi.waitFor(() => expect(host.textContent).toBe("hi"));

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example/todos/1");
    const headers = init.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer t");
    expect(headers.get("x-app")).toBe("override");
  });
});
