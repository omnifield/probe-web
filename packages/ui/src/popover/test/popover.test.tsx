import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@web-core/assembly";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Popover, kit as popoverKit } from "../components/index.js";
import { passport as popoverPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as popoverEditorInfo } from "../playground/index.js";

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
    popover: { passport: readable(popoverPassport, popoverEditorInfo), parts: popoverKit.parts, provider: Popover },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('popover "basic" — the floating half, open by default via providerProps', () => {
  it("shows the title/description from data, a close cross, and the arrow, addressed by the real anatomy", () => {
    const data = { title: "Favorite Frameworks", description: "Manage and organize your favorite web frameworks." };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(popoverPassport, assembly as PassportAssembly, "popover", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    expect(host.querySelector('[data-scope="popover"][data-part="title"]')?.textContent).toBe("Favorite Frameworks");
    expect(host.querySelector('[data-scope="popover"][data-part="description"]')?.textContent).toBe(
      "Manage and organize your favorite web frameworks.",
    );

    const content = host.querySelector('[data-scope="popover"][data-part="content"]');
    expect(content?.getAttribute("data-state")).toBe("open");

    const closeTrigger = host.querySelector('[data-scope="popover"][data-part="close-trigger"]');
    expect(closeTrigger?.textContent).toBe("✕");

    expect(host.querySelector('[data-scope="popover"][data-part="arrow"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="popover"][data-part="arrow-tip"]')).not.toBeNull();
  });
});
