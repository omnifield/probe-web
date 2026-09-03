import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Grid, GridCell, kit as gridKit } from "../components/index.js";
import { passport as gridPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as gridEditorInfo } from "../playground/index.js";

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
    grid: { passport: readable(gridPassport, gridEditorInfo), parts: gridKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('grid "basic" — four equal cells', () => {
  it("renders all four cells, in order, with their own text", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(gridPassport, assembly as PassportAssembly, "grid", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const cells = host.querySelectorAll('[data-scope="grid"][data-part="cell"]');
    expect(cells).toHaveLength(4);
    expect(cells[0]?.textContent).toBe("Ячейка 1");
    expect(cells[3]?.textContent).toBe("Ячейка 4");
  });
});

describe("grid — the tag is the consumer's choice", () => {
  it("renders <div> by default, and swaps to real tags via `as` on both root and cell", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => (
      <>
        <Grid as="section" data-testid="root">
          <GridCell as="article" data-testid="cell">
            текст
          </GridCell>
        </Grid>
      </>
    ), host);

    expect(host.querySelector('[data-testid="root"]')?.tagName).toBe("SECTION");
    expect(host.querySelector('[data-testid="cell"]')?.tagName).toBe("ARTICLE");
  });
});
