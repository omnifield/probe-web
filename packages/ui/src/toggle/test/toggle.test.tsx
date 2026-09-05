import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Toggle, ToggleIndicator, kit as toggleKit } from "../components/index.js";
import { passport as togglePassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as toggleEditorInfo } from "../playground/index.js";

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
    toggle: { passport: readable(togglePassport, toggleEditorInfo), parts: toggleKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('toggle "basic" — starts pressed via a static prop, real click flips it', () => {
  it("shows the star indicator, starts pressed", () => {
    const data = { glyph: "★" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(togglePassport, assembly as PassportAssembly, "toggle", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const root = host.querySelector('[data-scope="toggle"][data-part="root"]');
    expect(root?.getAttribute("data-state")).toBe("on");

    const indicator = host.querySelector('[data-scope="toggle"][data-part="indicator"]');
    expect(indicator?.textContent).toBe("★");
  });

  it("toggles to unpressed on click", async () => {
    const data = { glyph: "★" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(togglePassport, assembly as PassportAssembly, "toggle", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const root = host.querySelector('[data-scope="toggle"][data-part="root"]') as HTMLButtonElement;
    root.click();
    await Promise.resolve();

    expect(root.getAttribute("data-state")).toBe("off");
  });
});

describe("ToggleIndicator — fallback shows for the unpressed state, children for pressed", () => {
  it("real click flips fallback content to children content", async () => {
    const [pressed, setPressed] = createSignal(false);
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Toggle pressed={pressed()} onPressedChange={setPressed}>
          <ToggleIndicator fallback="outline">filled</ToggleIndicator>
        </Toggle>
      ),
      host,
    );

    const indicator = host.querySelector('[data-scope="toggle"][data-part="indicator"]');
    expect(indicator?.textContent).toBe("outline");

    (host.querySelector("button") as HTMLButtonElement).click();
    await Promise.resolve();

    expect(indicator?.textContent).toBe("filled");
  });
});
