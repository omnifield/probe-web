import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { Drawer, kit as drawerKit } from "../components/index.js";
import { passport as drawerPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as drawerEditorInfo } from "../playground/index.js";

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
    drawer: { passport: readable(drawerPassport, drawerEditorInfo), parts: drawerKit.parts, provider: Drawer },
  },
  admits,
});

beforeAll(() => {
  class FakeResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  (globalThis as any).ResizeObserver = FakeResizeObserver;
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('drawer "basic" — the floating half, open by default via providerProps', () => {
  it("shows the title/description from data, a grabber, and a close cross, addressed by the real anatomy", () => {
    const data = { title: "Настройки", description: "Настройте параметры аккаунта." };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(drawerPassport, assembly as PassportAssembly, "drawer", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    expect(host.querySelector('[data-scope="drawer"][data-part="title"]')?.textContent).toBe("Настройки");
    expect(host.querySelector('[data-scope="drawer"][data-part="description"]')?.textContent).toBe(
      "Настройте параметры аккаунта.",
    );

    const content = host.querySelector('[data-scope="drawer"][data-part="content"]');
    expect(content?.getAttribute("data-state")).toBe("open");
    expect(content?.getAttribute("data-swipe-direction")).toBe("down");

    expect(host.querySelector('[data-scope="drawer"][data-part="grabber"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="drawer"][data-part="grabber-indicator"]')).not.toBeNull();

    const closeTrigger = host.querySelector('[data-scope="drawer"][data-part="close-trigger"]');
    expect(closeTrigger?.textContent).toBe("✕");
  });
});
