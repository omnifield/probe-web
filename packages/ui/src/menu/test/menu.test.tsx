import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Menu, kit as menuKit } from "../components/index.js";
import type { Data } from "../entity/io.js";
import { passport as menuPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as menuEditorInfo } from "../playground/index.js";
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
    menu: { passport: readable(menuPassport, menuEditorInfo), parts: menuKit.parts, provider: Menu },
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

describe('menu "basic" — a labeled group, a separator, a checked item, open by default', () => {
  it("shows the group label, both plain items, and the checked item's text", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(menuPassport, assembly as PassportAssembly, "menu", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    // `RenderTree` wraps everything in one `<Suspense>` — the checked item's real Icon indicator
    // suspends the whole tree until it resolves, not just its own slot.
    await vi.waitFor(() => {
      if (!host.querySelector('[data-scope="menu"][data-part="item-group-label"]')) {
        throw new Error("suspended tree not resolved yet");
      }
    });

    const groupLabel = host.querySelector('[data-scope="menu"][data-part="item-group-label"]');
    expect(groupLabel?.textContent).toBe("Файл");

    const items = host.querySelectorAll('[data-scope="menu"][data-part="item"]');
    expect(items).toHaveLength(3);

    const separator = host.querySelector('[data-scope="menu"][data-part="separator"]');
    expect(separator).not.toBeNull();

    const itemText = host.querySelector('[data-scope="menu"][data-part="item-text"]');
    expect(itemText?.textContent).toBe("Уведомления");

    const content = host.querySelector('[data-scope="menu"][data-part="content"]');
    expect(content?.getAttribute("data-state")).toBe("open");

    const indicatorIcon = host.querySelector(
      '[data-scope="menu"][data-part="item-indicator"] svg[data-scope="icon"][data-part="root"]',
    );
    expect(indicatorIcon).not.toBeNull();
  });
});

describe('menu "list" — flat item list from data, canonical value/label item, click dispatches the whole item', () => {
  it("labels each item from data and dispatches select with the whole item as payload", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "list")!;
    const data: Data = { items: [{ value: "rename", label: "Переименовать" }, { value: "delete", label: "Удалить" }] };
    const tree = baseAssemblyOf(menuPassport, assembly as PassportAssembly, "menu", data);

    const dispatched: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => <RenderTree registry={REGISTRY} tree={tree} data={data} dispatch={(event) => dispatched.push(event)} />,
      host,
    );

    const texts = [...host.querySelectorAll('[data-scope="menu"][data-part="item-text"]')];
    expect(texts.map((text) => text.textContent)).toEqual(["Переименовать", "Удалить"]);

    const items = [...host.querySelectorAll('[data-scope="menu"][data-part="item"]')] as HTMLElement[];
    items[1]!.click();
    await Promise.resolve();

    expect(dispatched).toEqual([
      expect.objectContaining({ name: "select", context: { payload: { value: "delete", label: "Удалить" } } }),
    ]);
  });
});
