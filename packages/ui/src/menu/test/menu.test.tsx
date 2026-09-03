import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Menu, kit as menuKit } from "../components/index.js";
import { passport as menuPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as menuEditorInfo } from "../playground/index.js";

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
  it("shows the group label, both plain items, and the checked item's text", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(menuPassport, assembly as PassportAssembly, "menu", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

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
  });
});
