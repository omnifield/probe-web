// Смоук-проба зоны: настоящий рендер, настоящий фетч и настоящая мутация — не разбор опций.
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createMutation, createQuery, QueryClient, QueryClientProvider } from "../src/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mountWithClient(code: () => unknown): HTMLElement {
  const client = new QueryClient();
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <QueryClientProvider client={client}>{code() as never}</QueryClientProvider>, host);
  return host;
}

describe("@omnifield/probe-web-query", () => {
  it("createQuery отдаёт реактивный результат (без вызова как функции)", async () => {
    const fetchTodo = vi.fn().mockResolvedValue({ title: "hi" });

    function Todo() {
      // Опции — ФУНКЦИЯ (реактивная), не голый объект: solid-query отслеживает её как scope.
      const query = createQuery(() => ({ queryKey: ["todo", 1], queryFn: fetchTodo }));
      return <p>{query.isPending ? "loading" : query.data?.title}</p>;
    }

    const host = mountWithClient(() => <Todo />);
    expect(host.textContent).toBe("loading");

    await vi.waitFor(() => expect(host.textContent).toBe("hi"));
    expect(fetchTodo).toHaveBeenCalledTimes(1);
  });

  it("createMutation переводит состояние после успешного вызова", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true });

    function Save() {
      const mutation = createMutation(() => ({ mutationFn: save }));
      return (
        <button type="button" onClick={() => mutation.mutate()}>
          {mutation.isSuccess ? "saved" : "save"}
        </button>
      );
    }

    const host = mountWithClient(() => <Save />);
    const button = host.querySelector("button")!;
    expect(button.textContent).toBe("save");

    button.click();
    await vi.waitFor(() => expect(button.textContent).toBe("saved"));
    expect(save).toHaveBeenCalledTimes(1);
  });
});
