import { z } from "@web-core/io";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OpenapiEndpoint } from "../../../src/entities/openapi/index.js";
import { OpenapiList, type OpenapiListItem } from "../../../src/widgets/openapi/list.js";
import type { OpenapiInvocation } from "../../../src/widgets/openapi/types.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

function mount(items: readonly OpenapiListItem[], onChange: (invocation: OpenapiInvocation) => void): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <OpenapiList items={items} onChange={onChange} />, host);
  return host;
}

function endpoint(overrides: Partial<OpenapiEndpoint> = {}): OpenapiEndpoint {
  return { method: "GET", url: "https://api.example/pet/1", schema: z.object({}), ...overrides };
}

describe("OpenapiList", () => {
  it("рендерит метод+url на каждую ручку, без единого инпута конфигурации", () => {
    const host = mount(
      [
        { endpoint: endpoint({ url: "https://api.example/pet/1" }), value: {} },
        { endpoint: endpoint({ method: "POST", url: "https://api.example/pet" }), value: { body: { name: "a" } } },
      ],
      () => {},
    );

    expect(host.textContent).toContain("GET https://api.example/pet/1");
    expect(host.textContent).toContain("POST https://api.example/pet");
    expect(host.querySelectorAll('input[data-part="input"]')).toHaveLength(0);
  });

  it("«Вызвать» шлёт уже настроенный value, onChange несёт { endpoint, response }", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const invocations: OpenapiInvocation[] = [];
    const item: OpenapiListItem = { endpoint: endpoint({ url: "https://api.example/pet/{petId}" }), value: { petId: 7 } };
    const host = mount([item], (invocation) => invocations.push(invocation));

    host.querySelector("button")!.click();

    await vi.waitFor(() => expect(invocations).toHaveLength(1));
    expect(invocations[0]).toEqual({
      endpoint: item.endpoint,
      value: item.value,
      response: { status: 200, ok: true, headers: expect.any(Object), body: { id: 1 } },
    });

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.example/pet/7");
  });

  it("пустой список — ничего не рендерит, не падает", () => {
    const host = mount([], () => {});
    expect(host.querySelectorAll("button")).toHaveLength(0);
  });
});
