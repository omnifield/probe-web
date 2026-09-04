import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as scrollAreaKit } from "../components/index.js";
import { passport as scrollAreaPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as scrollAreaEditorInfo } from "../playground/index.js";

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
    "scroll-area": {
      passport: readable(scrollAreaPassport, scrollAreaEditorInfo),
      parts: scrollAreaKit.parts,
    },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('scroll area "basic" — long content from data, one vertical scrollbar', () => {
  it("carries the content text from data, addressed by the real anatomy", () => {
    const data = { content: "Строка первая. Строка вторая. Строка третья." };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(scrollAreaPassport, assembly as PassportAssembly, "scroll-area", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    expect(host.querySelector('[data-scope="scroll-area"][data-part="content"]')?.textContent).toBe(
      data.content,
    );

    const scrollbar = host.querySelector('[data-scope="scroll-area"][data-part="scrollbar"]');
    expect(scrollbar?.getAttribute("data-orientation")).toBe("vertical");

    const thumb = host.querySelector('[data-scope="scroll-area"][data-part="thumb"]');
    expect(thumb?.getAttribute("data-orientation")).toBe("vertical");

    expect(host.querySelector('[data-scope="scroll-area"][data-part="corner"]')).not.toBeNull();
  });
});
