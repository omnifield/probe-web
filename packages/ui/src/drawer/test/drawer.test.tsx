import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  Drawer,
  DrawerBackdrop,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerPositioner,
  DrawerTitle,
  DrawerTrigger,
  kit as drawerKit,
} from "../components/index.js";
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

describe("multiple triggers sharing one drawer", () => {
  it("marks the clicked trigger current and opens the shared drawer", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Drawer swipeDirection="end">
          <DrawerTrigger value="alice">Alice</DrawerTrigger>
          <DrawerTrigger value="bob">Bob</DrawerTrigger>
          <DrawerBackdrop />
          <DrawerPositioner>
            <DrawerContent>
              <DrawerTitle>Edit</DrawerTitle>
              <DrawerCloseTrigger>✕</DrawerCloseTrigger>
            </DrawerContent>
          </DrawerPositioner>
        </Drawer>
      ),
      host,
    );

    const triggers = host.querySelectorAll('[data-scope="drawer"][data-part="trigger"]');
    (triggers[1] as HTMLElement).click();
    await Promise.resolve();
    await Promise.resolve();

    expect(triggers[1].getAttribute("data-current")).toBe("");
    expect(triggers[0].getAttribute("data-current")).toBeNull();
    expect(host.querySelector('[data-scope="drawer"][data-part="content"]')?.getAttribute("data-state")).toBe(
      "open",
    );
  });
});
