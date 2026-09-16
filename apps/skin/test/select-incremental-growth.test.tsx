// Изолирует находку из select-in-slot-repro.test.tsx до голого движка (`packages/assembly` +
// kitComponentRenderer, БЕЗ apps/skin's Renderer/componentHandle) — растим `items` ПО ОДНОМУ,
// реальными отдельными тиками (setTimeout, не один synchronous .set()), как клик «Добавить»
// девять раз подряд, а не один set() с готовым массивом.

import { createMemo, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

// jsdom не даёт ResizeObserver — позиционирование popper'а (`content`, открытый select) следит
// за размером через настоящий `@floating-ui/dom`, которому он нужен даже в тесте, не только в
// браузере.
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

const CURRENCIES = [
  { value: "rub", label: "Рубль" },
  { value: "usd", label: "Доллар" },
  { value: "eur", label: "Евро" },
  { value: "gbp", label: "Фунт стерлингов" },
  { value: "cny", label: "Юань" },
  { value: "jpy", label: "Иена" },
  { value: "try", label: "Лира" },
  { value: "kzt", label: "Тенге" },
  { value: "aed", label: "Дирхам" },
];

describe("select — голый движок, items растут по одному (реальные отдельные тики)", () => {
  it("0 → 1 → 2 → ... → 9, каждый шаг отдельным тиком, клик В КОНЦЕ", async () => {
    const { registry, instanceOf } = kitComponentRenderer();
    const [data, setData] = createSignal<{
      label: string;
      placeholder: string;
      items: typeof CURRENCIES;
    }>({
      label: "Валюта счёта",
      placeholder: "Не выбрана",
      items: [],
    });
    const tree = createMemo(() => instanceOf("select", {}, "basic", data()));

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <RenderTree registry={registry} tree={tree()} data={data()} />,
      host,
    );

    for (let i = 0; i < CURRENCIES.length; i++) {
      await new Promise((r) => setTimeout(r, 10));
      setData({
        label: "Валюта счёта",
        placeholder: "Не выбрана",
        items: CURRENCIES.slice(0, i + 1),
      });
    }
    await new Promise((r) => setTimeout(r, 10));

    const trigger = host.querySelector(
      '[data-scope="select"][data-part="trigger"]',
    ) as HTMLElement;
    trigger.click();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 50));

    const items = document.body.querySelectorAll(
      '[data-scope="select"][data-part="item"]',
    );
    expect(items).toHaveLength(9);
  });

  it("контроль: тот же массив одним прыжком 0 → 9 — работает?", async () => {
    const { registry, instanceOf } = kitComponentRenderer();
    const [data, setData] = createSignal<{
      label: string;
      placeholder: string;
      items: typeof CURRENCIES;
    }>({
      label: "Валюта счёта",
      placeholder: "Не выбрана",
      items: [],
    });
    const tree = createMemo(() => instanceOf("select", {}, "basic", data()));

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <RenderTree registry={registry} tree={tree()} data={data()} />,
      host,
    );

    await new Promise((r) => setTimeout(r, 10));
    setData({
      label: "Валюта счёта",
      placeholder: "Не выбрана",
      items: CURRENCIES,
    });
    await new Promise((r) => setTimeout(r, 10));

    const trigger = host.querySelector(
      '[data-scope="select"][data-part="trigger"]',
    ) as HTMLElement;
    trigger.click();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 50));

    const items = document.body.querySelectorAll(
      '[data-scope="select"][data-part="item"]',
    );
    expect(items).toHaveLength(9);
  });
});
