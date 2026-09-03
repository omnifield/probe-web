import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { scaleLinear } from "d3-scale";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { DiagramAxis, DiagramGrid, DiagramRoot, kit as diagramKit } from "../components/index.js";
import { passport as diagramPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as diagramEditorInfo } from "../playground/index.js";

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
    diagram: { passport: readable(diagramPassport, diagramEditorInfo), parts: diagramKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('diagram "basic" — coordinate system, one x-axis and one y-axis, no series', () => {
  it("renders both axes with real ticks from their own scale", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(diagramPassport, assembly as PassportAssembly, "diagram", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const axes = [...host.querySelectorAll('[data-scope="diagram"][data-part="axis"]')];
    expect(axes).toHaveLength(2);
    expect(axes[0]?.getAttribute("data-orientation")).toBe("x");
    expect(axes[1]?.getAttribute("data-orientation")).toBe("y");

    for (const axis of axes) {
      expect(axis.querySelectorAll("text").length).toBeGreaterThan(0);
    }

    const grids = [...host.querySelectorAll('[data-scope="diagram"][data-part="grid"]')];
    expect(grids).toHaveLength(2);
    expect(grids[0]?.getAttribute("data-orientation")).toBe("x");
    expect(grids[1]?.getAttribute("data-orientation")).toBe("y");

    for (const grid of grids) {
      expect(grid.querySelectorAll("line").length).toBeGreaterThan(0);
    }
  });
});

describe("DiagramGrid — direct mount", () => {
  it("draws one line per tick, spanning the cross axis's from/to", () => {
    const scale = scaleLinear().domain([0, 10]).range([0, 100]);
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramGrid scale={scale} orientation="x" ticks={5} from={0} to={80} />
        </DiagramRoot>
      ),
      host,
    );

    const grid = host.querySelector('[data-scope="diagram"][data-part="grid"]')!;
    const lines = [...grid.querySelectorAll("line")];
    expect(lines).toHaveLength(scale.ticks(5).length);
    expect(lines[0]?.getAttribute("y1")).toBe("0");
    expect(lines[0]?.getAttribute("y2")).toBe("80");
  });

  it("without a scale draws a real, addressable, but empty node", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <DiagramRoot width={200} height={100}><DiagramGrid orientation="y" /></DiagramRoot>, host);

    const grid = host.querySelector('[data-scope="diagram"][data-part="grid"]')!;
    expect(grid).not.toBeNull();
    expect(grid.querySelectorAll("line")).toHaveLength(0);
  });
});

describe("DiagramAxis — direct mount", () => {
  it("draws a domain line plus one tick per requested value", () => {
    const scale = scaleLinear().domain([0, 10]).range([0, 100]);
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramAxis scale={scale} orientation="x" ticks={5} offset={80} />
        </DiagramRoot>
      ),
      host,
    );

    const axis = host.querySelector('[data-scope="diagram"][data-part="axis"]')!;
    expect(axis.querySelectorAll("line").length).toBe(1 + scale.ticks(5).length);
    expect(axis.querySelectorAll("text").length).toBe(scale.ticks(5).length);
  });

  it("without a scale draws a real, addressable, but empty node", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <DiagramRoot width={200} height={100}><DiagramAxis orientation="y" /></DiagramRoot>, host);

    const axis = host.querySelector('[data-scope="diagram"][data-part="axis"]')!;
    expect(axis).not.toBeNull();
    expect(axis.querySelectorAll("line, text")).toHaveLength(0);
  });
});

describe("DiagramRoot", () => {
  it("sizes the svg and its viewBox from width/height", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <DiagramRoot width={320} height={180} />, host);

    const svg = host.querySelector('[data-scope="diagram"][data-part="root"]')!;
    expect(svg.getAttribute("width")).toBe("320");
    expect(svg.getAttribute("height")).toBe("180");
    expect(svg.getAttribute("viewBox")).toBe("0 0 320 180");
  });
});
