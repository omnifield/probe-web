import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { kit as carouselKit } from "../components/index.js";
import { passport as carouselPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as carouselEditorInfo } from "../playground/index.js";

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
    carousel: { passport: readable(carouselPassport, carouselEditorInfo), parts: carouselKit.parts },
  },
  admits,
});

beforeAll(() => {
  class FakeIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  class FakeResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  (globalThis as any).IntersectionObserver = FakeIntersectionObserver;
  (globalThis as any).ResizeObserver = FakeResizeObserver;
  Element.prototype.scrollTo = () => {};
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('carousel "basic" — three slides from data, navigation, autoplay toggle, page counter', () => {
  it("labels each slide from data and draws every part of the anatomy", () => {
    const data = {
      slide1: { label: "Первый" },
      slide2: { label: "Второй" },
      slide3: { label: "Третий" },
    };

    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(carouselPassport, assembly as PassportAssembly, "carousel", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const items = [...host.querySelectorAll('[data-scope="carousel"][data-part="item"]')] as HTMLElement[];
    expect(items.map((item) => item.textContent)).toEqual(["Первый", "Второй", "Третий"]);

    expect(host.querySelector('[data-scope="carousel"][data-part="control"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="carousel"][data-part="prev-trigger"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="carousel"][data-part="next-trigger"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="carousel"][data-part="autoplay-trigger"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="carousel"][data-part="autoplay-indicator"]')?.textContent).toBe("▶");
    expect(host.querySelector('[data-scope="carousel"][data-part="progress-text"]')).not.toBeNull();

    const indicators = [...host.querySelectorAll('[data-scope="carousel"][data-part="indicator"]')];
    expect(indicators).toHaveLength(3);
  });

  it("marks the indicator of defaultPage as current on mount", () => {
    const data = {
      slide1: { label: "Первый" },
      slide2: { label: "Второй" },
      slide3: { label: "Третий" },
    };

    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(carouselPassport, assembly as PassportAssembly, "carousel", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const indicators = [...host.querySelectorAll('[data-scope="carousel"][data-part="indicator"]')] as HTMLButtonElement[];
    expect(indicators[0]?.getAttribute("data-current")).toBe("");
    expect(indicators[1]?.hasAttribute("data-current")).toBe(false);
    expect(indicators[2]?.hasAttribute("data-current")).toBe(false);
  });
});
