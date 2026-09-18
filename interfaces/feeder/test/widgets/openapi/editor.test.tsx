import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EndpointDescriptor } from "../../../src/entities/openapi/index.js";
import { OpenapiEditor } from "../../../src/widgets/openapi/editor.js";
import type { OpenapiGroup } from "../../../src/widgets/openapi/groups/types.js";
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

function mount(groups: readonly OpenapiGroup[], onChange: (invocation: OpenapiInvocation) => void, onGroupsChange: (groups: readonly OpenapiGroup[]) => void = () => {}): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <OpenapiEditor groups={groups} onGroupsChange={onGroupsChange} onChange={onChange} />, host);
  return host;
}

/** Реально стейтфульный монтаж (в отличие от `mount`, где `onGroupsChange` — просто наблюдатель) —
 *  для проверки, что группа САМА визуально возвращается в нейтральный вид, не только что колбэк
 *  позвали с правильными данными. */
function mountControlled(initial: readonly OpenapiGroup[]): { host: HTMLElement; groups: () => readonly OpenapiGroup[] } {
  const host = document.createElement("div");
  document.body.append(host);
  const [groups, setGroups] = createSignal<readonly OpenapiGroup[]>(initial);
  dispose = render(() => <OpenapiEditor groups={groups()} onGroupsChange={setGroups} onChange={() => {}} />, host);
  return { host, groups };
}

function schemaGroup(raw: string): OpenapiGroup {
  return { id: "g1", name: "Основной бэк", raw, endpoints: [] };
}

function manualGroup(endpoints: readonly EndpointDescriptor[] = []): OpenapiGroup {
  return { id: "g2", name: "Бэк без сваггера", raw: "", endpoints };
}

function emptyGroup(): OpenapiGroup {
  return { id: "g3", name: "Ещё не решено", raw: "", endpoints: [] };
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

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  setter.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("OpenapiEditor — группа-схема", () => {
  it("список ручек рендерится после распознавания свагера, под именем группы", async () => {
    const host = mount([schemaGroup(petstore)], () => {});

    await vi.waitFor(() => expect(host.textContent).toContain("GET https://petstore.swagger.io/v2/pet/{petId}"));

    expect(host.textContent).toContain("Основной бэк");
    expect(host.textContent).toContain("POST https://petstore.swagger.io/v2/pet");
  });

  it("пустой raw — ничего не рендерит и не падает, группа выглядит нейтральной (textarea+кнопка)", () => {
    const host = mount([schemaGroup("")], () => {});
    expect(host.querySelector("textarea")).not.toBeNull();
    expect(host.querySelector('button[aria-label="Добавить ручку вручную"]')).not.toBeNull();
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
  it("без единой группы рендерит только форму создания группы", () => {
    const host = mount([], () => {});
    expect(host.querySelectorAll('input[data-part="input"]')).toHaveLength(1);
    expect(host.querySelectorAll("button")).toHaveLength(1);
  });

  it("форма создания группы с именем зовёт onGroupsChange с новой нейтральной группой — без выбора вида", () => {
    let next: readonly OpenapiGroup[] = [];
    const host = mount([], () => {}, (groups) => (next = groups));

    setValue(host.querySelector('input[data-part="input"]')!, "Новый бэк");
    host.querySelector<HTMLButtonElement>("button")!.click();

    expect(next).toEqual([{ id: expect.any(String), name: "Новый бэк", raw: "", endpoints: [] }]);
  });

  it("«Убрать группу» зовёт onGroupsChange без неё", () => {
    let next: readonly OpenapiGroup[] | undefined;
    const host = mount([schemaGroup("")], () => {}, (groups) => (next = groups));

    host.querySelector<HTMLButtonElement>('button[aria-label="Убрать группу"]')!.click();

    expect(next).toEqual([]);
  });
});

describe("OpenapiEditor — нейтральная группа (вид детектится действием, не селектором и не флагом)", () => {
  it("рендерит textarea для схемы и кнопку «Добавить ручку вручную», без селектора вида", () => {
    const host = mount([emptyGroup()], () => {});
    expect(host.querySelector("textarea")).not.toBeNull();
    expect(host.querySelector('button[aria-label="Добавить ручку вручную"]')).not.toBeNull();
    expect(host.querySelector("select")).toBeNull();
  });

  it("вставить raw в textarea — группа становится схемой, тем же id/name", () => {
    let next: readonly OpenapiGroup[] | undefined;
    const host = mount([emptyGroup()], () => {}, (groups) => (next = groups));

    setTextareaValue(host.querySelector("textarea")!, petstore);

    expect(next).toEqual([{ id: "g3", name: "Ещё не решено", raw: petstore, endpoints: [] }]);
  });

  it("«Добавить ручку вручную» — группа становится юзерской, с одним пустым дескриптором", () => {
    let next: readonly OpenapiGroup[] | undefined;
    const host = mount([emptyGroup()], () => {}, (groups) => (next = groups));

    host.querySelector<HTMLButtonElement>('button[aria-label="Добавить ручку вручную"]')!.click();

    expect(next).toEqual([{ id: "g3", name: "Ещё не решено", raw: "", endpoints: [{ method: "GET", url: "", params: [] }] }]);
  });

  it("ввести один нераспознанный символ — приложение не падает, показывает текст ошибки (регрессия)", async () => {
    const { host, groups } = mountControlled([emptyGroup()]);

    setTextareaValue(host.querySelector("textarea")!, "x");

    await vi.waitFor(() => expect(host.textContent).toContain("none of the templates recognize"));
    // Дерево живо дальше — «Очистить» всё ещё реально работает, ничего не размонтировало приложение.
    Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Очистить")!.click();
    expect(groups()).toEqual([emptyGroup()]);
  });
});

describe("OpenapiEditor — группа-схема, обновление/очистка", () => {
  it("правка textarea — то же самое, что «обновить»: raw группы меняется через onGroupsChange", () => {
    let next: readonly OpenapiGroup[] | undefined;
    const host = mount([schemaGroup(petstore)], () => {}, (groups) => (next = groups));

    setTextareaValue(host.querySelector("textarea")!, "openapi: 3.0.0");

    expect(next).toEqual([{ id: "g1", name: "Основной бэк", raw: "openapi: 3.0.0", endpoints: [] }]);
  });

  it("«Очистить» — просто обнуляет raw, группа сама становится нейтральной (нет отдельного флага)", () => {
    const { host, groups } = mountControlled([schemaGroup(petstore)]);
    expect(groups()[0]!.raw).not.toBe("");

    Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Очистить")!.click();

    expect(groups()).toEqual([{ id: "g1", name: "Основной бэк", raw: "", endpoints: [] }]);
    expect(host.querySelector('button[aria-label="Добавить ручку вручную"]')).not.toBeNull();
  });
});

describe("OpenapiEditor — группа-юзер", () => {
  it("уже с одной ручкой — «Добавить» в дереве дописывает ВТОРУЮ пустую ручку через onGroupsChange", () => {
    const first: EndpointDescriptor = { method: "GET", url: "https://api.example.com/a", params: [] };
    let next: readonly OpenapiGroup[] | undefined;
    const host = mount([manualGroup([first])], () => {}, (groups) => (next = groups));

    host.querySelector<HTMLButtonElement>('button[aria-label="Добавить"]')!.click();

    expect(next).toEqual([manualGroup([first, { method: "GET", url: "", params: [] }])]);
  });

  it("убрать ПОСЛЕДНЮЮ ручку — группа сама визуально возвращается в нейтральную (регрессия)", () => {
    const { host, groups } = mountControlled([manualGroup([{ method: "GET", url: "https://api.example.com/ping", params: [] }])]);

    host.querySelector<HTMLButtonElement>('button[aria-label="Убрать"]')!.click();

    expect(groups()).toEqual([manualGroup([])]);
    // Не осталась «юзерской» с пустым списком — рендерит нейтральный вид заново.
    expect(host.querySelector('button[aria-label="Добавить ручку вручную"]')).not.toBeNull();
    expect(host.querySelector("textarea")).not.toBeNull();
  });

  it("уже заполненный дескриптор — url виден как РЕДАКТИРУЕМОЕ поле (не текст EndpointCard), отправить в том же аккордионе вызывает invoke", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const filledGroup = manualGroup([{ method: "GET", url: "https://api.example.com/ping", params: [{ name: "id", type: "string", required: true }] }]);
    const invocations: OpenapiInvocation[] = [];
    const host = mount([filledGroup], (invocation) => invocations.push(invocation));

    expect(findInputNear(host, "url").value).toBe("https://api.example.com/ping");

    const idInput = findInputNear(host, "id");
    setValue(idInput, "42");
    findInvokeButtonNear(idInput).click();

    await vi.waitFor(() => expect(invocations).toHaveLength(1));
    expect(invocations[0]!.endpoint.url).toBe("https://api.example.com/ping");
    expect(invocations[0]!.value).toEqual({ id: "42" });
  });
});
