import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("RenderTree — data стартует undefined, потом появляется", () => {
  it("текст появляется, когда data меняется с undefined на объект", () => {
    const { registry, instanceOf } = kitComponentRenderer();
    const tree = instanceOf("button", {}, "base");

    const [data, setData] = createSignal<unknown>(undefined);

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={registry} tree={tree} data={data()} />, host);

    const root = () => host.querySelector('[data-scope="button"][data-part="root"]');
    expect(root()?.textContent).toBe("");

    setData({ label: "первый" });
    expect(root()?.textContent).toBe("первый");
  });
});
