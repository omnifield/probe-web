import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import {
  Slider,
  SliderControl,
  SliderMarker,
  SliderMarkerGroup,
  SliderRange,
  SliderThumb,
  SliderTrack,
  kit as sliderKit,
} from "../components/index.js";
import { passport as sliderPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as sliderEditorInfo } from "../playground/index.js";

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
    slider: { passport: readable(sliderPassport, sliderEditorInfo), parts: sliderKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('slider "basic" — label and starting value from data, one thumb', () => {
  it("shows the label and starting value, addressed by the real anatomy", () => {
    const data = { label: "Громкость", defaultValue: [40] };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(sliderPassport, assembly as PassportAssembly, "slider", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    expect(host.querySelector('[data-scope="slider"][data-part="label"]')?.textContent).toBe("Громкость");

    const thumb = host.querySelector('[data-scope="slider"][data-part="thumb"]');
    expect(thumb?.getAttribute("aria-valuenow")).toBe("40");
  });

  it("increments the value with the keyboard", async () => {
    const data = { label: "Громкость", defaultValue: [40] };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(sliderPassport, assembly as PassportAssembly, "slider", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const thumb = host.querySelector('[data-scope="slider"][data-part="thumb"]') as HTMLElement;
    thumb.focus();
    thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(thumb.getAttribute("aria-valuenow")).toBe("41");
  });
});

describe("markers — data-state is the marker's own position relative to the current value", () => {
  it("real value under/at/over each marker's own value, not interaction", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Slider defaultValue={[40]}>
          <SliderControl>
            <SliderTrack>
              <SliderRange />
            </SliderTrack>
            <SliderThumb index={0} />
          </SliderControl>
          <SliderMarkerGroup>
            <SliderMarker value={25}>25</SliderMarker>
            <SliderMarker value={40}>40</SliderMarker>
            <SliderMarker value={75}>75</SliderMarker>
          </SliderMarkerGroup>
        </Slider>
      ),
      host,
    );

    const markers = [...host.querySelectorAll('[data-scope="slider"][data-part="marker"]')];
    expect(markers.map((marker) => marker.getAttribute("data-state"))).toEqual([
      "under-value",
      "at-value",
      "over-value",
    ]);
  });
});

describe("range — two thumbs, each with its own independent value", () => {
  it("mounts one thumb per index, each with its own aria-valuenow", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Slider defaultValue={[30, 60]}>
          <SliderControl>
            <SliderTrack>
              <SliderRange />
            </SliderTrack>
            <SliderThumb index={0} />
            <SliderThumb index={1} />
          </SliderControl>
        </Slider>
      ),
      host,
    );

    const thumbs = [...host.querySelectorAll('[data-scope="slider"][data-part="thumb"]')];
    expect(thumbs).toHaveLength(2);
    expect(thumbs.map((thumb) => thumb.getAttribute("aria-valuenow"))).toEqual(["30", "60"]);
  });
});
