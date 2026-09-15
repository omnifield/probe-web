import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OpenapiEditor } from "../../../src/widgets/openapi/editor.js";
import type { OpenapiInvocation } from "../../../src/widgets/openapi/types.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../../entities/openapi/fixtures");
const petstore = readFileSync(join(fixtureDir, "petstore.yaml"), "utf-8");

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

function mount(raw: string, onChange: (invocation: OpenapiInvocation) => void): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <OpenapiEditor raw={raw} onChange={onChange} />, host);
  return host;
}

function findInputNear(host: HTMLElement, labelText: string): HTMLInputElement {
  const label = Array.from(host.querySelectorAll("p")).find((node) => node.textContent === labelText);
  if (!label?.parentElement) throw new Error(`поле "${labelText}" не найдено`);
  const input = label.parentElement.querySelector<HTMLInputElement>('input[data-part="input"]');
  if (!input) throw new Error(`инпут для "${labelText}" не найден`);
  return input;
}

/** Кнопка «Отправить» ближайшей карточки ручки — поднимаемся от инпута параметра до предка,
 *  который несёт ровно одну такую кнопку (карточка ручки — граница, у соседних ручек своя). */
function findInvokeButtonNear(input: HTMLElement): HTMLButtonElement {
  for (let ancestor = input.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const buttons = Array.from(ancestor.querySelectorAll("button")).filter((button) => button.textContent === "Отправить");
    if (buttons.length === 1) return buttons[0]!;
  }
  throw new Error("кнопка «Отправить» не найдена рядом с полем");
}

describe("OpenapiEditor", () => {
  it("список ручек рендерится после распознавания свагера", async () => {
    const host = mount(petstore, () => {});

    await vi.waitFor(() => expect(host.querySelectorAll('input[data-part="input"]').length).toBeGreaterThan(0));

    expect(host.textContent).toContain("GET https://petstore.swagger.io/v2/pet/{petId}");
    expect(host.textContent).toContain("POST https://petstore.swagger.io/v2/pet");
  });

  it("пустой raw — ничего не рендерит и не падает (не пытается распознать)", () => {
    const host = mount("", () => {});
    expect(host.querySelectorAll('input[data-part="input"]')).toHaveLength(0);
  });

  it("заполнить параметр, отправить — вызывает fetch и onChange с { endpoint, response }", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 42, name: "doggie" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const invocations: OpenapiInvocation[] = [];
    const host = mount(petstore, (invocation) => invocations.push(invocation));

    await vi.waitFor(() => findInputNear(host, "petId"));
    const petIdInput = findInputNear(host, "petId");

    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(petIdInput, "42");
    petIdInput.dispatchEvent(new Event("input", { bubbles: true }));

    findInvokeButtonNear(petIdInput).click();

    await vi.waitFor(() => expect(invocations).toHaveLength(1));
    expect(invocations[0]!.endpoint.url).toBe("https://petstore.swagger.io/v2/pet/{petId}");
    expect(invocations[0]!.value).toEqual({ petId: 42 });
    expect(invocations[0]!.response).toEqual({
      status: 200,
      ok: true,
      headers: expect.any(Object),
      body: { id: 42, name: "doggie" },
    });

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://petstore.swagger.io/v2/pet/42");
  });
});
