// Регрессия на баг движка (`@web-core/assembly`'s `contentOf`, см. его FAQ.md/ROADMAP.yaml) —
// дерево, пересобираемое заново на каждую смену data (тем же приёмом, что Renderer с repeat-
// сборками вроде tree-view), теряло байндинг со второй пересборки. Тест написан ГОЛЫМ RenderTree,
// без Renderer apps/skin — доказывает, что причина была в движке, не в обвязке.

import { createMemo, createSignal } from "solid-js";
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

describe("RenderTree — дерево пересобирается на каждую смену data (как у Renderer)", () => {
  it("повторный .set() данных обновляет текст, даже когда дерево каждый раз новое", () => {
    const { registry, instanceOf } = kitComponentRenderer();

    const [data, setData] = createSignal<unknown>({ label: "первый" });
    const tree = createMemo(() => instanceOf("button", {}, "base", data()));

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <RenderTree registry={registry} tree={tree()} data={data()} />,
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
