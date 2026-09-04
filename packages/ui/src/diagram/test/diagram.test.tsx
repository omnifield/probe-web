import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { scaleBand, scaleLinear } from "d3-scale";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import {
  DiagramArea,
  DiagramAxis,
  DiagramBar,
  DiagramGrid,
  DiagramLine,
  DiagramPoint,
  DiagramRoot,
  kit as diagramKit,
} from "../components/index.js";
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

describe('diagram "line" — a real series drawn over the coordinate system', () => {
  it("renders one path with a real d attribute, over the grid and under the axes in DOM order", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "line")!;
    const tree = baseAssemblyOf(diagramPassport, assembly as PassportAssembly, "diagram", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const lines = [...host.querySelectorAll('[data-scope="diagram"][data-part="line"]')];
    expect(lines).toHaveLength(1);

    const d = lines[0]?.getAttribute("d");
    expect(d).toMatch(/^M/);
    expect(d?.match(/L/g)).toHaveLength(6);
  });
});

describe("DiagramLine — direct mount", () => {
  it("draws one M plus one L per remaining point, positioned through xScale/yScale", () => {
    const data = [
      { at: 0, value: 0 },
      { at: 1, value: 10 },
      { at: 2, value: 5 },
    ];
    const xScale = scaleLinear().domain([0, 2]).range([0, 100]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramLine data={data} xScale={xScale} yScale={yScale} x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const path = host.querySelector('[data-scope="diagram"][data-part="line"]')!;
    expect(path.getAttribute("d")).toBe("M0,100L50,0L100,50");
  });

  it("without data draws a real, addressable path with no d attribute", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramLine<{ at: number; value: number }> x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const path = host.querySelector('[data-scope="diagram"][data-part="line"]')!;
    expect(path).not.toBeNull();
    expect(path.hasAttribute("d")).toBe(false);
  });
});

describe('diagram "area" — a filled series drawn over the coordinate system', () => {
  it("renders one filled path with a real, closed d attribute", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "area")!;
    const tree = baseAssemblyOf(diagramPassport, assembly as PassportAssembly, "diagram", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const areas = [...host.querySelectorAll('[data-scope="diagram"][data-part="area"]')];
    expect(areas).toHaveLength(1);

    const d = areas[0]?.getAttribute("d");
    expect(d).toMatch(/^M/);
    expect(d).toMatch(/Z$/);
  });
});

describe("DiagramArea — direct mount", () => {
  it("fills from the value down to the yScale's baseline (range()[0])", () => {
    const data = [
      { at: 0, value: 0 },
      { at: 1, value: 10 },
      { at: 2, value: 5 },
    ];
    const xScale = scaleLinear().domain([0, 2]).range([0, 100]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramArea data={data} xScale={xScale} yScale={yScale} x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const path = host.querySelector('[data-scope="diagram"][data-part="area"]')!;
    expect(path.getAttribute("d")).toBe("M0,100L50,0L100,50L100,100L50,100L0,100Z");
  });

  it("without data draws a real, addressable path with no d attribute", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramArea<{ at: number; value: number }> x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const path = host.querySelector('[data-scope="diagram"][data-part="area"]')!;
    expect(path).not.toBeNull();
    expect(path.hasAttribute("d")).toBe(false);
  });
});

describe('diagram "bar" — categorical columns drawn over the y coordinate', () => {
  it("renders one rect per data point", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "bar")!;
    const tree = baseAssemblyOf(diagramPassport, assembly as PassportAssembly, "diagram", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const bars = host.querySelector('[data-scope="diagram"][data-part="bar"]')!;
    expect(bars.querySelectorAll("rect")).toHaveLength(4);
  });
});

describe("DiagramBar — direct mount", () => {
  it("positions and sizes each rect from the band scale's own bandwidth/step", () => {
    const data = [
      { category: "A", value: 5 },
      { category: "B", value: 10 },
    ];
    const xScale = scaleBand<string>().domain(["A", "B"]).range([0, 100]).padding(0);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramBar data={data} xScale={xScale} yScale={yScale} x={(d) => d.category} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const rects = [...host.querySelectorAll('[data-scope="diagram"][data-part="bar"] rect')];
    expect(rects).toHaveLength(2);
    expect(rects[0]?.getAttribute("x")).toBe("0");
    expect(rects[0]?.getAttribute("y")).toBe("50");
    expect(rects[0]?.getAttribute("width")).toBe("50");
    expect(rects[0]?.getAttribute("height")).toBe("50");
    expect(rects[1]?.getAttribute("x")).toBe("50");
    expect(rects[1]?.getAttribute("y")).toBe("0");
    expect(rects[1]?.getAttribute("height")).toBe("100");
  });

  it("without data draws a real, addressable, but empty node", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramBar<{ category: string; value: number }> x={(d) => d.category} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const bar = host.querySelector('[data-scope="diagram"][data-part="bar"]')!;
    expect(bar).not.toBeNull();
    expect(bar.querySelectorAll("rect")).toHaveLength(0);
  });
});

describe('diagram "point" — a scatter series drawn over the coordinate system', () => {
  it("renders one circle per data point", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "point")!;
    const tree = baseAssemblyOf(diagramPassport, assembly as PassportAssembly, "diagram", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const points = host.querySelector('[data-scope="diagram"][data-part="point"]')!;
    expect(points.querySelectorAll("circle")).toHaveLength(8);
  });
});

describe("DiagramPoint — direct mount", () => {
  it("positions each circle through xScale/yScale, default radius 3", () => {
    const data = [
      { at: 0, value: 0 },
      { at: 1, value: 10 },
      { at: 2, value: 5 },
    ];
    const xScale = scaleLinear().domain([0, 2]).range([0, 100]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramPoint data={data} xScale={xScale} yScale={yScale} x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const circles = [...host.querySelectorAll('[data-scope="diagram"][data-part="point"] circle')];
    expect(circles).toHaveLength(3);
    expect(circles[0]?.getAttribute("cx")).toBe("0");
    expect(circles[0]?.getAttribute("cy")).toBe("100");
    expect(circles[1]?.getAttribute("cx")).toBe("50");
    expect(circles[1]?.getAttribute("cy")).toBe("0");
    expect(circles.every((circle) => circle.getAttribute("r") === "3")).toBe(true);
  });

  it("without data draws a real, addressable, but empty node", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramPoint<{ at: number; value: number }> x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const point = host.querySelector('[data-scope="diagram"][data-part="point"]')!;
    expect(point).not.toBeNull();
    expect(point.querySelectorAll("circle")).toHaveLength(0);
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
