// Весь путь целиком, не только Renderer в изоляции — стор, фейк-генератор и показ разом, как в
// реальном приложении (Input пишет componentDataAtom, показ его читает).
import { useAtom } from "@web-core/store";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { componentDataAtom, setCurrentComponent } from "#/entities/component";
import { Input } from "#/widgets/component/input";
import { Preview } from "#/widgets/component/preview";

// jsdom не даёт IntersectionObserver/ResizeObserver — карусель (Preview → Slot) заводит их
// настоящей zag-машиной, которая следит за видимостью и размером слайдов. Живому браузеру оба
// есть, здесь — минимальные заглушки, только чтобы карусель могла смонтироваться.
(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function Wired() {
  const data = useAtom(componentDataAtom);
  return (
    <>
      <Input />
      <Preview component="button" assembly="base" data={data()} />
    </>
  );
}

describe("Input -> componentDataAtom -> Preview, реальный путь", () => {
  it("автогенерация на смену компонента доезжает до показа текстом", async () => {
    setCurrentComponent("button");

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Wired />, host);

    const root = () => host.querySelector('[data-scope="button"][data-part="root"]');

    for (let i = 0; i < 20 && !root()?.textContent; i++) {
      await new Promise((r) => setTimeout(r, 50));
    }

    expect(root()?.textContent).not.toBe("");
  }, 15000);
});
