// Сузить регрессию из renderer-reactivity.test.tsx: тут дерево строится ОДИН раз (не в memo, не
// зависит от data) — если баг («второй .set() не доезжает») повторяется и здесь, дело в
// RenderTree/RenderNode (`@web-core/assembly/render`), не в том, как apps/skin строит дерево.

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("RenderTree — статичное дерево, меняется только data", () => {
  it("повторный .set() данных обновляет показанный текст", () => {
    const { registry, instanceOf } = kitComponentRenderer();
    const tree = instanceOf("button", {}, "base");

    const [data, setData] = createSignal<unknown>({ label: "первый" });

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <RenderTree registry={registry} tree={tree} data={data()} />,
      host,
    );

    const root = () =>
      host.querySelector('[data-scope="button"][data-part="root"]');
    expect(root()?.textContent).toBe("первый");

    setData({ label: "второй" });
    expect(root()?.textContent).toBe("второй");

    setData({ label: "третий" });
    expect(root()?.textContent).toBe("третий");
  });
});
