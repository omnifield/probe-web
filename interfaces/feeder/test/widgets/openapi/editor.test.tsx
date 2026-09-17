import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OpenapiEditor } from "../../../src/widgets/openapi/editor.js";
import type { OpenapiGroup, OpenapiInvocation, SchemaGroup } from "../../../src/widgets/openapi/types.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../../entities/openapi/fixtures");
const petstore = readFileSync(join(fixtureDir, "petstore.yaml"), "utf-8");

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

function mount(groups: readonly OpenapiGroup[], onChange: (invocation: OpenapiInvocation) => void, onGroupsChange: (groups: readonly OpenapiGroup[]) => void = () => {}): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <OpenapiEditor groups={groups} onGroupsChange={onGroupsChange} onChange={onChange} />, host);
  return host;
}

function schemaGroup(raw: string): SchemaGroup {
  return { id: "g1", name: "Основной бэк", kind: "schema", raw };
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

function setValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("OpenapiEditor — группа-схема", () => {
  it("список ручек рендерится после распознавания свагера, под именем группы", async () => {
    const host = mount([schemaGroup(petstore)], () => {});

    await vi.waitFor(() => expect(host.textContent).toContain("GET https://petstore.swagger.io/v2/pet/{petId}"));

    expect(host.textContent).toContain("Основной бэк");
    expect(host.textContent).toContain("POST https://petstore.swagger.io/v2/pet");
  });

  it("пустой raw — ничего не рендерит и не падает (не пытается распознать), кроме формы «добавить группу»", () => {
    const host = mount([schemaGroup("")], () => {});
    // Единственный инпут на экране — «Название группы» формы добавления, ни одной карточки ручки.
    expect(host.querySelectorAll('input[data-part="input"]')).toHaveLength(1);
    expect(host.textContent).not.toContain("GET ");
  });

  it("заполнить параметр, отправить — вызывает fetch и onChange с { endpoint, value, response }", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 42, name: "doggie" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const invocations: OpenapiInvocation[] = [];
    const host = mount([schemaGroup(petstore)], (invocation) => invocations.push(invocation));

    await vi.waitFor(() => findInputNear(host, "petId"));
    const petIdInput = findInputNear(host, "petId");
    setValue(petIdInput, "42");

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

describe("OpenapiEditor — группы", () => {
  it("без единой группы рендерит только форму «добавить группу»", () => {
    const host = mount([], () => {});
    expect(host.textContent).toContain("Добавить группу");
    expect(host.querySelectorAll('input[data-part="input"]')).toHaveLength(1);
  });

  it("«Добавить группу» с именем зовёт onGroupsChange с новой группой-схемой", () => {
    let next: readonly OpenapiGroup[] = [];
    const host = mount([], () => {}, (groups) => (next = groups));

    setValue(host.querySelector('input[data-part="input"]')!, "Новый бэк");
    Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Добавить группу")!.click();

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ name: "Новый бэк", kind: "schema", raw: "" });
  });

  it("«Убрать группу» зовёт onGroupsChange без неё", () => {
    let next: readonly OpenapiGroup[] | undefined;
    const host = mount([schemaGroup("")], () => {}, (groups) => (next = groups));

    host.querySelector<HTMLButtonElement>('button[aria-label="Убрать группу"]')!.click();

    expect(next).toEqual([]);
  });
});

describe("OpenapiEditor — группа-юзер", () => {
  function manualGroup(): OpenapiGroup {
    return { id: "g2", name: "Бэк без сваггера", kind: "manual", endpoints: [] };
  }

  it("пустая группа — без готовых ручек, но с кнопкой «Добавить» дерева дескриптора", () => {
    const host = mount([manualGroup()], () => {});
    expect(host.textContent).toContain("Бэк без сваггера");
    expect(host.querySelectorAll('button[aria-label="Добавить"]').length).toBeGreaterThan(0);
    expect(host.textContent).not.toContain("Отправить");
  });

  it("«Добавить» в дереве дескриптора дописывает пустую ручку через onGroupsChange", () => {
    let next: readonly OpenapiGroup[] | undefined;
    const host = mount([manualGroup()], () => {}, (groups) => (next = groups));

    host.querySelector<HTMLButtonElement>('button[aria-label="Добавить"]')!.click();

    expect(next).toEqual([{ ...manualGroup(), endpoints: [{ method: "GET", url: "", params: [] }] }]);
  });

  it("уже заполненный дескриптор — своя карточка EndpointCard, отправить вызывает invoke как у группы-схемы", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const filledGroup: OpenapiGroup = {
      ...manualGroup(),
      endpoints: [{ method: "GET", url: "https://api.example.com/ping", params: [{ name: "id", type: "string", required: true }] }],
    };
    const invocations: OpenapiInvocation[] = [];
    const host = mount([filledGroup], (invocation) => invocations.push(invocation));

    expect(host.textContent).toContain("GET https://api.example.com/ping");

    const idInput = findInputNear(host, "id");
    setValue(idInput, "42");
    findInvokeButtonNear(idInput).click();

    await vi.waitFor(() => expect(invocations).toHaveLength(1));
    expect(invocations[0]!.endpoint.url).toBe("https://api.example.com/ping");
    expect(invocations[0]!.value).toEqual({ id: "42" });
  });
});
