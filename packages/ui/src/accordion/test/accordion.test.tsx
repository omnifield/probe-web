import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { kit as accordionKit } from "../components/index.js";
import { passport as accordionPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as accordionEditorInfo } from "../playground/index.js";

import { kit as listboxKit } from "../../listbox/components/index.js";
import { passport as listboxPassport } from "../../listbox/entity/passport.js";
import { editorInfo as listboxEditorInfo } from "../../listbox/playground/index.js";

import { kit as iconKit } from "../../icon/components/index.js";
import { passport as iconPassport } from "../../icon/entity/passport.js";
import { editorInfo as iconEditorInfo } from "../../icon/playground/index.js";

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
    accordion: { passport: readable(accordionPassport, accordionEditorInfo), parts: accordionKit.parts },
    listbox: { passport: readable(listboxPassport, listboxEditorInfo), parts: listboxKit.parts },
    icon: { passport: readable(iconPassport, iconEditorInfo), parts: iconKit.parts },
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
      items: [
        {
          value: "s1",
          label: "Section 1",
          children: [
            { value: "i1", label: "Item 1" },
            { value: "i2", label: "Item 2" },
          ],
        },
      ],
    };

    const assembly = assemblies.find((candidate) => candidate.name === "action-list")!;
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

    await vi.waitFor(() => {
      if (!host.querySelector('[data-scope="accordion"][data-part="control"]')) {
        throw new Error("tree not rendered yet");
      }
    });

    const trigger = host.querySelector('[data-scope="accordion"][data-part="control"]') as HTMLElement | null;
    expect(trigger?.textContent).toBe("Section 1");

    const list = host.querySelector('[data-scope="listbox"]') as HTMLElement | null;
    expect(list?.getAttribute("data-variant")).toBe("compact");

    const items = [...host.querySelectorAll('[data-scope="listbox"][data-part="item"]')] as HTMLElement[];
    const texts = [...host.querySelectorAll('[data-scope="listbox"][data-part="item-text"]')] as HTMLElement[];
    expect(texts.map((text) => text.textContent)).toEqual(["Item 1", "Item 2"]);

    // Индикатор — реальный `<Icon>` со своей `<Suspense>`-границей (см. `icon/components/root.tsx`),
    // резолвится независимо от остального дерева, поэтому ждём его отдельно.
    await vi.waitFor(
      () => {
        if (!items[0]?.querySelector('svg[data-scope="icon"][data-part="root"]')) {
          throw new Error("icon not resolved yet");
        }
      },
      { timeout: 10_000 },
    );

    trigger?.click();
    items[1]!.click();
    await Promise.resolve();

    expect(dispatched).toEqual([
      expect.objectContaining({
        name: "triggerClick",
        context: { payload: { value: "s1", label: "Section 1", children: data.items[0]!.children } },
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

describe('accordion "base" — sections from data, the content spot left for whoever renders it', () => {
  const data = {
    items: [
      { value: "контурная", label: "контурная" },
      { value: "сплошная", label: "сплошная" },
    ],
  };

  const treeOf = () => {
    const assembly = assemblies.find((candidate) => candidate.name === "base")!;
    return baseAssemblyOf(accordionPassport, assembly as PassportAssembly, "accordion", data);
  };

  const mount = (): HTMLElement => {
    const host = document.createElement("div");
    document.body.append(host);
    return host;
  };

  const partsOf = (host: HTMLElement, part: string): HTMLElement[] =>
    [...host.querySelectorAll(`[data-scope="accordion"][data-part="${part}"]`)] as HTMLElement[];

  it("repeats one item per data row, titles its trigger, and leaves the content node empty", () => {
    const host = mount();

    dispose = render(() => <RenderTree registry={REGISTRY} tree={treeOf()} data={data} />, host);

    expect(partsOf(host, "control").map((trigger) => trigger.textContent)).toEqual([
      "контурная",
      "сплошная",
    ]);

    const contents = partsOf(host, "content");
    expect(contents).toHaveLength(2);
    expect(contents.map((content) => content.textContent)).toEqual(["", ""]);
  });

  it("hands a slot on the content each section's own variant — what the showcase reads", () => {
    const host = mount();

    dispose = render(
      () => (
        <RenderTree
          registry={REGISTRY}
          tree={treeOf()}
          data={data}
          slots={{
            "accordion.content": {
              render: (resolved) => <span>{String(resolved.variant)}</span>,
              placement: "replace",
            },
          }}
        />
      ),
      host,
    );

    expect(partsOf(host, "content").map((content) => content.textContent)).toEqual([
      "контурная",
      "сплошная",
    ]);
  });
});
