import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Flow, FlowItem, kit as flowKit } from "../components/index.js";
import { passport as flowPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as flowEditorInfo } from "../playground/index.js";

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
    flow: { passport: readable(flowPassport, flowEditorInfo), parts: flowKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('flow "basic" — two items in order', () => {
  it("renders both items, in order, with their own text", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(flowPassport, assembly as PassportAssembly, "flow", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const items = host.querySelectorAll('[data-scope="flow"][data-part="item"]');
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toBe("Первый");
    expect(items[1]?.textContent).toBe("Второй");
  });
});

describe("flow — the tag is the consumer's choice", () => {
  it("renders <div> by default, and swaps to real tags via `as` on both root and item", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => (
      <>
        <Flow as="nav" data-testid="root">
          <FlowItem as="span" data-testid="item">
            текст
          </FlowItem>
        </Flow>
      </>
    ), host);

    expect(host.querySelector('[data-testid="root"]')?.tagName).toBe("NAV");
    expect(host.querySelector('[data-testid="item"]')?.tagName).toBe("SPAN");
  });
});
