// Мастеринг — зона, где создаётся АДАПТЕР (схема↔компонент). Он не знает о настройке ручки
// (метод/адрес/хедеры/тело — своя сущность `entities/openapi`, DBP.md): читает уже готовую
// схему и io-схему компонента, только показывает их парой и заводит `Adapter`-запись.
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@web-core/skin/presets", async () => {
  const actual = await vi.importActual<typeof import("@web-core/skin/presets")>("@web-core/skin/presets");
  return {
    ...actual,
    createPresetsClient: () => ({
      list: async () => [],
      get: async () => undefined,
      save: async () => {
        throw new Error("save: не нужно в этом тесте");
      },
      replace: async () => {
        throw new Error("replace: не нужно в этом тесте");
      },
      remove: async () => {},
    }),
  };
});

import { setCurrentComponent } from "#/entities/component";
import { adaptersAtom, AdapterMastering } from "#/entities/adapter";
import { endpointsAtom, setCurrentEndpointId, type Endpoint } from "#/entities/openapi";
import { schemasAtom } from "#/entities/schema";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
  endpointsAtom.set([]);
  schemasAtom.set([]);
  adaptersAtom.set([]);
});

async function mountAndWaitFor(text: string): Promise<HTMLElement> {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <AdapterMastering />, host);

  for (let i = 0; i < 20 && !host.textContent?.includes(text); i++) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return host;
}

describe("AdapterMastering — только схемы, без настройки ручки", () => {
  it("показывает поля io-схемы компонента и поля сохранённой схемы ручки, каждые в двух блоках", async () => {
    const endpoint: Endpoint = { id: "e1", method: "GET", url: "https://api.example.com/todos/1", headers: [], body: "" };
    endpointsAtom.set([endpoint]);
    setCurrentEndpointId(endpoint.id);
    schemasAtom.set([
      {
        id: "s1",
        endpointId: endpoint.id,
        skeleton: { type: "object", properties: { userId: { type: "number" }, title: { type: "string" } } },
      },
    ]);
    setCurrentComponent("button");

    const host = await mountAndWaitFor("label — string");

    expect(host.textContent).toContain("label — string");
    expect(host.textContent).toContain("userId — number");
    expect(host.textContent).toContain("title — string");

    // оба блока (Приём/Отдача) несут одну и ту же пару схем — по два вхождения каждого поля
    expect(host.textContent?.split("label — string").length).toBe(3);
  }, 15000);

  it("не рисует ни одного поля формы ручки (метод/адрес/хедеры/тело)", async () => {
    const endpoint: Endpoint = { id: "e1", method: "GET", url: "https://api.example.com/todos/1", headers: [], body: "" };
    endpointsAtom.set([endpoint]);
    setCurrentEndpointId(endpoint.id);
    setCurrentComponent("button");

    const host = await mountAndWaitFor("button ↔");

    expect(host.querySelector('input[placeholder="https://api.example.com/items"]')).toBeNull();
    expect(host.querySelector('[data-scope="select"]')).toBeNull();
  }, 15000);

  it("выбор компонента+ручки со схемой заводит ровно один Adapter на пару", async () => {
    const endpoint: Endpoint = { id: "e1", method: "GET", url: "https://api.example.com/todos/1", headers: [], body: "" };
    endpointsAtom.set([endpoint]);
    setCurrentEndpointId(endpoint.id);
    schemasAtom.set([{ id: "s1", endpointId: endpoint.id, skeleton: { type: "null" } }]);
    setCurrentComponent("button");

    await mountAndWaitFor("button ↔");

    expect(adaptersAtom.get()).toHaveLength(1);
    expect(adaptersAtom.get()[0]).toMatchObject({ schemaId: "s1", component: "button" });
  }, 15000);
});
