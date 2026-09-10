import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { endpointsAtom, OpenApi, schemasAtom } from "#/entities/adapter";

(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let dispose: (() => void) | undefined;
let host: HTMLElement;

beforeEach(() => {
  endpointsAtom.set([]);
  schemasAtom.set([]);
  host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <OpenApi />, host);
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function addButton(): HTMLElement {
  return [...host.querySelectorAll("button")].find((button) => button.textContent === "Добавить эндпоинт")!;
}

describe("OpenApi — добавление и заполнение эндпоинта", () => {
  it("клик по «Добавить эндпоинт» даёт одну раскрывашку GET (без адреса)", () => {
    expect(host.querySelectorAll('[data-scope="accordion"][data-part="item"]')).toHaveLength(0);

    addButton().click();

    const items = host.querySelectorAll('[data-scope="accordion"][data-part="item"]');
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toContain("GET");
    expect(items[0]?.textContent).toContain("без адреса");
  });

  it("правка адреса отражается в заголовке раскрывашки", () => {
    addButton().click();
    host.querySelector<HTMLButtonElement>('[data-scope="accordion"][data-part="control"]')!.click();

    const url = host.querySelector<HTMLInputElement>('input[placeholder="https://api.example.com/items"]')!;
    url.value = "https://api.example.com/orders";
    url.dispatchEvent(new Event("input", { bubbles: true }));

    const control = host.querySelector('[data-scope="accordion"][data-part="control"]')!;
    expect(control.textContent).toContain("https://api.example.com/orders");
  });

  it("GET не показывает поле тела, POST — показывает", () => {
    addButton().click();
    host.querySelector<HTMLButtonElement>('[data-scope="accordion"][data-part="control"]')!.click();

    expect(host.querySelector('textarea[placeholder="{}"]')).toBeNull();

    endpointsAtom.set((endpoints) => endpoints.map((endpoint) => ({ ...endpoint, method: "POST" })));

    expect(host.querySelector('textarea[placeholder="{}"]')).not.toBeNull();
  });

  it("«Добавить хедер» даёт строку с двумя полями, «Удалить» её убирает", () => {
    addButton().click();
    host.querySelector<HTMLButtonElement>('[data-scope="accordion"][data-part="control"]')!.click();

    const addHeader = [...host.querySelectorAll("button")].find((button) => button.textContent === "Добавить хедер")!;
    addHeader.click();

    expect(host.querySelector('input[placeholder="Header"]')).not.toBeNull();
    expect(host.querySelector('input[placeholder="Value"]')).not.toBeNull();

    const removeHeader = [...host.querySelectorAll("button")].find((button) => button.textContent === "Удалить")!;
    removeHeader.click();

    expect(host.querySelector('input[placeholder="Header"]')).toBeNull();
  });

  it("«Отправить запрос» стоит выше «Добавить хедер» и зовёт fetch с методом/адресом/хедерами", async () => {
    addButton().click();
    host.querySelector<HTMLButtonElement>('[data-scope="accordion"][data-part="control"]')!.click();

    const url = host.querySelector<HTMLInputElement>('input[placeholder="https://api.example.com/items"]')!;
    url.value = "https://api.example.com/orders";
    url.dispatchEvent(new Event("input", { bubbles: true }));

    const addHeader = [...host.querySelectorAll("button")].find((button) => button.textContent === "Добавить хедер")!;
    addHeader.click();

    const key = host.querySelector<HTMLInputElement>('input[placeholder="Header"]')!;
    key.value = "X-Test";
    key.dispatchEvent(new Event("input", { bubbles: true }));
    const value = host.querySelector<HTMLInputElement>('input[placeholder="Value"]')!;
    value.value = "1";
    value.dispatchEvent(new Event("input", { bubbles: true }));

    const buttons = [...host.querySelectorAll("button")];
    const sendIndex = buttons.findIndex((button) => button.textContent === "Отправить запрос");
    const addHeaderIndex = buttons.findIndex((button) => button.textContent === "Добавить хедер");
    expect(sendIndex).toBeGreaterThanOrEqual(0);
    expect(sendIndex).toBeLessThan(addHeaderIndex);

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => '{"ok":true}',
    } as Response);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    buttons[sendIndex]!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/orders",
      expect.objectContaining({ method: "GET", headers: { "X-Test": "1" } }),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 200, ok: true, body: { ok: true } }));

    fetchMock.mockRestore();
    logSpy.mockRestore();
  });

  it("«Сохранить как схему» кладёт скелет ответа, привязанный к эндпоинту, и показывает его в форме", async () => {
    addButton().click();
    host.querySelector<HTMLButtonElement>('[data-scope="accordion"][data-part="control"]')!.click();

    const url = host.querySelector<HTMLInputElement>('input[placeholder="https://api.example.com/items"]')!;
    url.value = "https://jsonplaceholder.typicode.com/todos/1";
    url.dispatchEvent(new Event("input", { bubbles: true }));

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => '{"userId":1,"id":1,"title":"delectus aut autem","completed":false}',
    } as Response);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const saveButton = [...host.querySelectorAll("button")].find((button) => button.textContent === "Сохранить как схему")!;
    saveButton.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(schemasAtom.get()).toHaveLength(1);
    expect(schemasAtom.get()[0]?.skeleton).toEqual({
      type: "object",
      properties: {
        userId: { type: "number" },
        id: { type: "number" },
        title: { type: "string" },
        completed: { type: "boolean" },
      },
    });

    const preview = host.querySelector("pre")!;
    expect(preview.textContent).toContain('"userId"');
    expect(preview.textContent).toContain('"type": "number"');

    fetchMock.mockRestore();
    logSpy.mockRestore();
  });
});
