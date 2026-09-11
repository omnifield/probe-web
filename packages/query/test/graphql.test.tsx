import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createQuery, QueryClient, QueryClientProvider } from "../src/index.js";
import { createGraphQLClient, gql, graphqlRequest } from "../src/graphql/index.js";

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

const todoQuery = gql`
  query Todo($id: Int!) {
    todo(id: $id) {
      title
    }
  }
`;

describe("@web-core/query/graphql", () => {
  it("graphqlRequest подставляется как queryFn и доезжает до реального рендера", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { todo: { title: "hi" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    function Todo() {
      const query = createQuery(() => ({
        queryKey: ["todo", 1],
        queryFn: () => graphqlRequest<{ todo: { title: string } }>("https://api.example/graphql", todoQuery, { id: 1 }),
      }));
      return <p>{query.isPending ? "loading" : query.data?.todo.title}</p>;
    }

    const host = mountWithClient(() => <Todo />);
    expect(host.textContent).toBe("loading");

    await vi.waitFor(() => expect(host.textContent).toBe("hi"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string | URL, RequestInit];
    expect(String(url)).toBe("https://api.example/graphql");
    const body = JSON.parse(init.body as string) as { query: string; variables: unknown };
    expect(body.variables).toEqual({ id: 1 });
    expect(body.query).toContain("Todo");
  });

  it("createGraphQLClient конфигурируется один раз, url/headers не повторяются на вызов", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { todo: { title: "hi" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = createGraphQLClient({ url: "https://api.example/graphql", headers: { authorization: "Bearer t" } });

    function Todo() {
      const query = createQuery(() => ({
        queryKey: ["todo", 1],
        queryFn: () => api.request<{ todo: { title: string } }>(todoQuery, { id: 1 }),
      }));
      return <p>{query.isPending ? "loading" : query.data?.todo.title}</p>;
    }

    const host = mountWithClient(() => <Todo />);
    await vi.waitFor(() => expect(host.textContent).toBe("hi"));

    const [url, init] = fetchMock.mock.calls[0] as [string | URL, RequestInit];
    expect(String(url)).toBe("https://api.example/graphql");
    expect((init.headers as Headers).get("authorization")).toBe("Bearer t");
  });
});
