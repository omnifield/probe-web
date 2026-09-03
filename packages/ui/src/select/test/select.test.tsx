import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

if (typeof Element.prototype.scrollTo !== "function") {
  Element.prototype.scrollTo = () => {};
}

import { kit } from "../components/index.js";
import { passport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo } from "../playground/index.js";

const readableSelect: ReadableComponent = {
  passport: {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
    selfAssembly: (passport as any).selfAssembly,
  },
  parts: kit.parts,
};

const REGISTRY: Registry = createRegistry({
  components: { select: readableSelect },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(data: unknown, dispatch: (event: unknown) => void = () => {}) {
  const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
  const tree = baseAssemblyOf(passport, assembly as PassportAssembly, "select", data);

  const host = document.createElement("div");
  document.body.append(host);

  dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} dispatch={dispatch} />, host);

  return host;
}

describe('select "basic" — skeleton filled from data, nothing hardcoded in the assembly', () => {
  it("shows the label, the placeholder, and the items the data brings", () => {
    const data = {
      label: "Фрукт",
      placeholder: "Выберите фрукт",
      items: [
        { value: "apple", label: "Яблоко" },
        { value: "banana", label: "Банан" },
        { value: "cherry", label: "Вишня" },
      ],
    };

    const host = mount(data);

    const label = host.querySelector('[data-scope="select"][data-part="label"]');
    expect(label?.textContent).toBe("Фрукт");

    const valueText = host.querySelector('[data-scope="select"][data-part="value-text"]');
    expect(valueText?.textContent).toBe("Выберите фрукт");

    const items = [...document.querySelectorAll('[data-scope="select"][data-part="item"]')] as HTMLElement[];
    expect(items.map((item) => item.textContent)).toEqual(["Яблоко", "Банан", "Вишня"]);
  });

  it("shows however many items the data brings — `repeat` names no count of its own", () => {
    mount({ label: "Цвет", items: [{ value: "r", label: "Красный" }] });

    const items = document.querySelectorAll('[data-scope="select"][data-part="item"]');
    expect(items).toHaveLength(1);
  });

  it("does not crash when `/items` has not arrived yet — an empty list, not a `TypeError`", () => {
    mount({ label: "Страна" });

    expect(document.querySelectorAll('[data-scope="select"][data-part="item"]')).toHaveLength(0);
  });

  it("opens on trigger click, picks an item, and closes — the floating layer actually cycles", async () => {
    const data = {
      label: "Фрукт",
      items: [
        { value: "apple", label: "Яблоко" },
        { value: "banana", label: "Банан" },
      ],
    };

    const host = mount(data);

    const trigger = host.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement;
    trigger.click();
    await Promise.resolve();

    expect(trigger.getAttribute("data-state")).toBe("open");

    const items = [...document.querySelectorAll('[data-scope="select"][data-part="item"]')] as HTMLElement[];
    items[1]!.click();
    await Promise.resolve();

    expect(trigger.getAttribute("data-state")).toBe("closed");

    const valueText = host.querySelector('[data-scope="select"][data-part="value-text"]');
    expect(valueText?.textContent).toBe("Банан");
  });

  it("opens and picks a SECOND time in a row — the reported bug: content stays up, unclickable, after the first pick", async () => {
    const data = {
      label: "Фрукт",
      items: [
        { value: "apple", label: "Яблоко" },
        { value: "banana", label: "Банан" },
        { value: "cherry", label: "Вишня" },
      ],
    };

    const host = mount(data);
    const trigger = host.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement;

    trigger.click();
    await Promise.resolve();
    let items = [...document.querySelectorAll('[data-scope="select"][data-part="item"]')] as HTMLElement[];
    items[0]!.click();
    await Promise.resolve();

    expect(trigger.getAttribute("data-state")).toBe("closed");
    expect(host.querySelector('[data-scope="select"][data-part="value-text"]')?.textContent).toBe("Яблоко");

    trigger.click();
    await Promise.resolve();
    expect(trigger.getAttribute("data-state")).toBe("open");

    items = [...document.querySelectorAll('[data-scope="select"][data-part="item"]')] as HTMLElement[];
    items[2]!.click();
    await Promise.resolve();

    expect(trigger.getAttribute("data-state")).toBe("closed");
    expect(host.querySelector('[data-scope="select"][data-part="value-text"]')?.textContent).toBe("Вишня");
  });

  it("dispatches \"select\" with the whole picked item on click — the same path component-list.tsx listens on", () => {
    const data = {
      label: "Фрукт",
      items: [
        { value: "apple", label: "Яблоко" },
        { value: "banana", label: "Банан" },
      ],
    };

    const dispatched: unknown[] = [];
    const host = mount(data, (event) => dispatched.push(event));

    const trigger = host.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement;
    trigger.click();

    const items = [...document.querySelectorAll('[data-scope="select"][data-part="item"]')] as HTMLElement[];
    items[1]!.click();

    expect(dispatched).toEqual([
      expect.objectContaining({
        name: "select",
        context: { payload: { value: "banana", label: "Банан" } },
      }),
    ]);
  });
});
