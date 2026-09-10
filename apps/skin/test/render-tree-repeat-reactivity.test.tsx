// Узкий репро для `repeat-items-empty-on-embed` (apps/skin/ROADMAP.yaml) — соседи
// (`render-tree-rebuild-reactivity.test.tsx`/`render-tree-reactivity.test.tsx`) уже доказали, что
// ЛИСТОВОЙ текстовый байндинг (`{genus:"text", value:{path:"/label"}}`) переживает повторный
// `.set()` данных, даже когда дерево пересобирается в `createMemo` (тот же приём, что `Renderer`).
// Ни один из них не трогает СТРУКТУРНЫЙ байндинг (`repeat`) — количество узлов, а не текст внутри
// уже существующего.
//
// НАБЛЮДЕНИЕ (2026-09-10, живой repro через `kitComponentRenderer`+`RenderTree`, без apps/skin-
// обвязки — значит движок, не витрина): переход 0 items → N items ПОСЛЕ монтирования у
// `radio-group` (`item` — прямой потомок `root`) отрабатывает корректно (тест ниже), у `select`
// (`item` — потомок `content`, который сам внутри `positioner`, открытого сразу) — раньше НЕТ.
// ПОЧИНЕНО в `packages/assembly` — `content-of-null-vs-for-by-structure`/`-breaks-ark-native-
// defaults` (два критерия null-vs-`<For>`, коммит `9b44feb`) закрыли РОВНО этот 0→N прыжок, тест
// ниже — `it` (не `it.fails`), зелёный по `expect`, регрессии не будет молча.
//
// ВТОРОЙ, СОСЕДНИЙ баг нашёлся уже ПОСЛЕ этого фикса (`content-of-for-freezes-after-first-
// nonempty`, ROADMAP.yaml пакета, тоже почищен): один прыжок 0→N был не единственный путь — рост
// ПО ОДНОМУ (несколько отдельных `.set()`, а не один разом, как реально работает «Добавить» в
// `apps/skin`) замирал НАВСЕГДА на первом непустом состоянии. `test/select-incremental-growth.
// test.tsx` доказывает голый движок на этом кейсе отдельно.
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";
import { createMemo, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("RenderTree — repeat (структура), не только текст листа", () => {
  it("узлы item появляются, когда items приезжают ПОСЛЕ монтирования", () => {
    const { registry, instanceOf } = kitComponentRenderer();

    const [data, setData] = createSignal<unknown>(undefined);
    const tree = createMemo(() => instanceOf("radio-group", {}, "basic", data()));

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={registry} tree={tree()} data={data()} />, host);

    const items = () => host.querySelectorAll('[data-scope="radio-group"][data-part="item"]');
    expect(items()).toHaveLength(0);

    setData({
      label: "Доставка",
      items: [
        { value: "courier", label: "Курьер" },
        { value: "pickup", label: "Самовывоз" },
        { value: "post", label: "Почта" },
      ],
    });

    expect(items()).toHaveLength(3);
  });

  it("повторная смена items меняет количество узлов на каждый .set(), не только на первый", () => {
    const { registry, instanceOf } = kitComponentRenderer();

    const [data, setData] = createSignal<unknown>({ label: "Доставка", items: [{ value: "a", label: "A" }] });
    const tree = createMemo(() => instanceOf("radio-group", {}, "basic", data()));

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={registry} tree={tree()} data={data()} />, host);

    const items = () => host.querySelectorAll('[data-scope="radio-group"][data-part="item"]');
    expect(items()).toHaveLength(1);

    setData({
      label: "Доставка",
      items: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    });
    expect(items()).toHaveLength(2);

    setData({ label: "Доставка", items: [] });
    expect(items()).toHaveLength(0);
  });

  it("select: content стартует БЕЗ item — items, добавленные позже, появляются (движок)", () => {
    const { registry, instanceOf } = kitComponentRenderer();

    const [data, setData] = createSignal<unknown>(undefined);
    const tree = createMemo(() => instanceOf("select", { open: true }, "basic", data()));

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={registry} tree={tree()} data={data()} />, host);

    setData({
      label: "Валюта счёта",
      placeholder: "Не выбрана",
      items: [
        { value: "rub", label: "Рубль" },
        { value: "usd", label: "Доллар" },
      ],
    });

    const items = document.body.querySelectorAll('[data-scope="select"][data-part="item"]');
    expect(items).toHaveLength(2);
  });
});
