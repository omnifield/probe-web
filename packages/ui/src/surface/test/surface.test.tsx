import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as surfaceKit, Surface } from "../components/index.js";
import { passport as surfacePassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as surfaceEditorInfo } from "../playground/index.js";

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
    surface: { passport: readable(surfacePassport, surfaceEditorInfo), parts: surfaceKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('surface "basic" — one addressable node with content', () => {
  it("renders the root with its address and the assembly's own text", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(surfacePassport, assembly as PassportAssembly, "surface", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const root = host.querySelector('[data-scope="surface"][data-part="root"]');
    expect(root?.tagName).toBe("DIV");
    expect(root?.textContent).toBe("Поверхность");
  });
});

describe("surface — the tag is the consumer's choice", () => {
  it("renders a <div> by default and swaps to a real <section> via `as`", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => (
      <>
        <Surface data-testid="default" />
        <Surface as="section" aria-label="итоги" data-testid="section" />
      </>
    ), host);

    expect(host.querySelector('[data-testid="default"]')?.tagName).toBe("DIV");
    const section = host.querySelector('[data-testid="section"]');
    expect(section?.tagName).toBe("SECTION");
    expect(section?.getAttribute("aria-label")).toBe("итоги");
  });
});
