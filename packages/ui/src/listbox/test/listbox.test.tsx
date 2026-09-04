import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@web-core/assembly";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as listboxKit } from "../components/index.js";
import { passport as listboxPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as listboxEditorInfo } from "../playground/index.js";

function readable<Part extends string, Data = unknown>(
  passport: ComponentPassport<Part>,
  editorInfo: PassportEditorInfo<Part, string, Data>,
): ReadableComponent["passport"] {
  return {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
    selfAssembly: passport.selfAssembly as any,
  };
}

const REGISTRY: Registry = createRegistry({
  components: {
    listbox: { passport: readable(listboxPassport, listboxEditorInfo), parts: listboxKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(data: unknown) {
  const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
  const tree = baseAssemblyOf(listboxPassport, assembly as PassportAssembly, "listbox", data);

  const host = document.createElement("div");
  document.body.append(host);

  dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} dispatch={() => {}} />, host);

  return host;
}

describe('listbox "basic" — skeleton filled from data, nothing hardcoded in the assembly', () => {
  it("shows the label and items the data brings, and reacts to a click", async () => {
    const data = {
      label: "Страна",
      items: [
        { value: "us", label: "США" },
        { value: "uk", label: "Великобритания" },
        { value: "ca", label: "Канада" },
      ],
    };

    const host = mount(data);

    const label = host.querySelector('[data-scope="listbox"][data-part="label"]');
    expect(label?.textContent).toBe("Страна");

    const items = [...host.querySelectorAll('[data-scope="listbox"][data-part="item"]')] as HTMLElement[];
    const texts = [...host.querySelectorAll('[data-scope="listbox"][data-part="item-text"]')] as HTMLElement[];
    expect(texts.map((text) => text.textContent)).toEqual(["США", "Великобритания", "Канада"]);
    expect(items.map((item) => item.dataset.state)).toEqual(["unchecked", "unchecked", "unchecked"]);

    items[1]!.click();
    await Promise.resolve();
    expect(items[1]?.dataset.state).toBe("checked");
    expect(items[0]?.dataset.state).toBe("unchecked");
  });

  it("shows however many items the data brings — `repeat` names no count of its own", () => {
    const host = mount({ label: "Цвет", items: [{ value: "r", label: "Красный" }] });

    const items = host.querySelectorAll('[data-scope="listbox"][data-part="item"]');
    expect(items).toHaveLength(1);
  });

  it("does not crash when `/items` has not arrived yet — an empty list, not a `TypeError`", () => {
    const host = mount({ label: "Страна" });

    expect(host.querySelectorAll('[data-scope="listbox"][data-part="item"]')).toHaveLength(0);
  });
});
