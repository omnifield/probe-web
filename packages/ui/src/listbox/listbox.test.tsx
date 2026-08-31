// Live proof for `playground/assemblies.ts`'s "basic" — through the real mechanism
// (`baseAssemblyOf`/`RenderTree` on a real registry), not a type-level claim. Same shape as
// `button.test.tsx`'s own "playground assembly \"base\"" case: the assembly carries no content,
// `data` supplies the label and the items here, in the test — the same place button's own
// `{ label: "Оформить заказ" }` lives.
//
// `await Promise.resolve()` after `.click()` — measured, not copied from the button's own test:
// `ITEM.CLICK`'s actions (`listbox.machine.js`) update the Zag store synchronously, but the Solid
// adapter's own subscription (`@zag-js/solid`) flushes the resulting `data-state` re-render on a
// microtask, not inline with the DOM click handler. The button's own test never hit this because
// it only checks the plain callback array `dispatch()` fills synchronously, never a Zag-owned
// attribute.

import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit } from "./components/kit.jsx";
import { passport } from "./entity/passport.js";
import { assemblies } from "./playground/assemblies.js";
import { editorInfo } from "./playground/index.js";

const readableListbox: ReadableComponent = {
  passport: {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- narrow-shape boundary, same as accordion.test.tsx: `passport` has no `selfAssembly` field to begin with
    selfAssembly: (passport as any).selfAssembly,
  },
  parts: kit.parts,
};

const REGISTRY: Registry = createRegistry({
  components: { listbox: readableListbox },
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
  const tree = baseAssemblyOf(passport, assembly, "listbox", data);

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
    // Measured live in the running app (products/skin): `bind: { items: "/items" }` resolves to
    // `undefined` before the data panel's data lands, and `createListCollection({ items: undefined })`
    // throws `TypeError: options.items is not iterable` — a real transient state a JSON path
    // miss produces, not a hypothetical.
    const host = mount({ label: "Страна" });

    expect(host.querySelectorAll('[data-scope="listbox"][data-part="item"]')).toHaveLength(0);
  });
});
