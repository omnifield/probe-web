// Live proof for the "action-list" assembly (playground/assemblies.ts) — the real motivating case
// for PWEB-167–172: the trigger dispatches the whole section via a plain path (""), and each
// item's content is a real Listbox reference fed by data only (bind, no on/children restated,
// one node for the whole `items` array — a listbox iterates its own collection internally,
// unlike the button this assembly used to repeat one-per-item).

import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as accordionKit } from "../components/kit.jsx";
import { passport as accordionPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as accordionEditorInfo } from "../playground/index.js";

import { kit as listboxKit } from "../../listbox/components/kit.jsx";
import { passport as listboxPassport } from "../../listbox/entity/passport.js";
import { editorInfo as listboxEditorInfo } from "../../listbox/playground/index.js";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- narrow-shape boundary, same as button.test.tsx
    selfAssembly: passport.selfAssembly as any,
  };
}

const REGISTRY: Registry = createRegistry({
  components: {
    accordion: { passport: readable(accordionPassport, accordionEditorInfo), parts: accordionKit.parts },
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

describe('accordion "action-list" — real Listbox per section, trigger dispatches the whole node', () => {
  it("shows section titles on triggers, item labels in the listbox, carrying its own skin variant", async () => {
    const data = {
      sections: [
        {
          id: "s1",
          title: "Section 1",
          items: [
            { value: "i1", label: "Item 1" },
            { value: "i2", label: "Item 2" },
          ],
        },
      ],
    };

    const assembly = assemblies.find((candidate) => candidate.name === "action-list")!;
    // `baseAssemblyOf` is a plain runtime tree walker — it never reads `Data`, only resolves paths
    // against whatever `data` it is handed at call time, so widening here is correct: the same
    // reasoning as `EDITOR_INFOS`'s own cast (`scripts/templates/passport.ts.hbs`).
    const tree = baseAssemblyOf(accordionPassport, assembly as PassportAssembly, "accordion", data);

    const dispatched: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <RenderTree
          registry={REGISTRY}
          tree={tree}
          data={data}
          dispatch={(event) => dispatched.push(event)}
        />
      ),
      host,
    );

    const trigger = host.querySelector('[data-scope="accordion"][data-part="item-trigger"]') as HTMLElement | null;
    expect(trigger?.textContent).toBe("Section 1");

    const list = host.querySelector('[data-scope="listbox"]') as HTMLElement | null;
    expect(list?.getAttribute("data-variant")).toBe("compact");

    const items = [...host.querySelectorAll('[data-scope="listbox"][data-part="item"]')] as HTMLElement[];
    const texts = [...host.querySelectorAll('[data-scope="listbox"][data-part="item-text"]')] as HTMLElement[];
    expect(texts.map((text) => text.textContent)).toEqual(["Item 1", "Item 2"]);

    trigger?.click();
    items[1]!.click();
    await Promise.resolve();

    expect(dispatched).toEqual([
      expect.objectContaining({
        name: "triggerClick",
        context: { payload: { id: "s1", title: "Section 1", items: data.sections[0]!.items } },
      }),
      expect.objectContaining({
        name: "select",
        context: { payload: { value: "i2", label: "Item 2" } },
      }),
    ]);
    expect(items[1]?.dataset.state).toBe("checked");
    expect(items[0]?.dataset.state).toBe("unchecked");
  });
});
