// Живой репро реального бага (сообщён user'ом, 2026-09-10): `select` внутри `Slot` (реальный
// `Carousel`/`CarouselItem`, не синтетика) открывался пустым — ни одного `item` — хотя ТОТ ЖЕ
// `Renderer` с ТЕМИ ЖЕ данными, смонтированный БЕЗ `Slot` рядом, показывал все item'ы. Причина
// была не в `Slot`/`Carousel` — `content-of-for-freezes-after-first-nonempty` (ROADMAP.yaml
// пакета `packages/assembly`), уже почищена там; здесь — регрессия через РЕАЛЬНЫЙ `Slot`, не
// голый движок (тот — `test/select-incremental-growth.test.tsx`).
import { useAtom } from "@web-core/store";
import { createEffect, For } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  formRecord: {
    id: "test-form",
    label: "select",
    name: "select-form",
    state: {
      name: "select-form",
      component: "select",
      recipe: { variants: { basic: {} } },
      variantTags: { basic: ["default"] },
    },
  },
}));

vi.mock("@web-core/skin/presets", async () => {
  const actual = await vi.importActual<typeof import("@web-core/skin/presets")>("@web-core/skin/presets");
  return {
    ...actual,
    createPresetsClient: () => ({
      list: async (kind: string) => {
        if (kind === "form") return [mockState.formRecord];
        return [];
      },
      get: async () => undefined,
      save: async () => {
        throw new Error("save: не нужно в этом тесте");
      },
      replace: async () => {
        throw new Error("replace: не нужно в этом тесте");
      },
      remove: async () => {},
    }),
  };
});

import { componentDataAtom, componentHandle, setCurrentComponent } from "#/entities/component";
import { Renderer } from "#/shared/ui/renderer";
import { Slot } from "#/entities/showcase";
import { queryClient } from "#/shared/api/query-client";

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
if (typeof Element.prototype.scrollTo !== "function") {
  Element.prototype.scrollTo = () => {};
}

const DATA = {
  label: "Валюта счёта",
  placeholder: "Не выбрана",
  items: [
    { value: "rub", label: "Рубль" },
    { value: "usd", label: "Доллар" },
  ],
};

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
  queryClient.clear();
});

function WiredSlot() {
  const data = useAtom(componentDataAtom);
  const component = componentHandle();
  const tagGroups = () => (component.info()?.skin?.forms ?? []).flatMap((f) => f.tags);
  const assemblies = () => component.info()?.editorInfo?.assemblies ?? [];

  // Как реальный `Input` (`widgets/component/input/index.tsx`) — данные кладутся РЕАКТИВНО,
  // после того как компонент готов, а не до монтирования: `componentHandle()`'s собственный
  // `createEffect(on(currentComponent, ...))` (`handle.ts`) сбрасывает `componentDataAtom` в
  // `undefined` на КАЖДУЮ смену `currentComponent`, включая самую первую (`on` без `defer` бежит
  // сразу) — set ДО монтирования тут же стирается этим эффектом.
  createEffect(() => {
    if (component.ready()) component.setData(DATA);
  });

  return (
    <For each={tagGroups()}>
      {(tag) => (
        <Slot
          component="select"
          assemblies={assemblies()}
          tag={tag.tag}
          variants={tag.variants}
          data={data()}
          loading={component.loading()}
        />
      )}
    </For>
  );
}

function WiredBareRenderer() {
  const data = useAtom(componentDataAtom);
  const component = componentHandle();
  const assemblies = () => component.info()?.editorInfo?.assemblies ?? [];

  createEffect(() => {
    if (component.ready()) component.setData(DATA);
  });

  return <Renderer component="select" assembly={assemblies()[0]?.name} variant="basic" data={data()} />;
}

async function waitFor(check: () => boolean, tries = 40): Promise<void> {
  for (let i = 0; i < tries && !check(); i++) {
    await new Promise((r) => setTimeout(r, 50));
  }
}

describe("select — Slot (реальный Carousel) vs голый Renderer, те же данные", () => {
  it("голый Renderer: item'ы есть в DOM сразу (content не портален по умолчанию, но заведомо открыт по data-state)", async () => {
    setCurrentComponent(undefined);
    setCurrentComponent("select");

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <WiredBareRenderer />, host);

    await waitFor(() => host.querySelector('[data-scope="select"][data-part="trigger"]') !== null);
    const trigger = host.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement | null;
    expect(trigger).not.toBeNull();
    trigger!.click();

    await waitFor(() => document.body.querySelectorAll('[data-scope="select"][data-part="item"]').length > 0);
    const items = document.body.querySelectorAll('[data-scope="select"][data-part="item"]');
    expect(items).toHaveLength(2);
  }, 15000);

  it("через Slot (реальный Ark Carousel): item'ы?", async () => {
    setCurrentComponent(undefined);
    setCurrentComponent("select");

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <WiredSlot />, host);

    await waitFor(() => host.querySelector('[data-scope="select"][data-part="trigger"]') !== null, 80);
    const trigger = host.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement | null;
    expect(trigger).not.toBeNull();
    trigger!.click();

    await waitFor(() => document.body.querySelectorAll('[data-scope="select"][data-part="item"]').length > 0);
    const items = document.body.querySelectorAll('[data-scope="select"][data-part="item"]');
    expect(items).toHaveLength(2);
  }, 15000);
});

// ДИНАМИЧЕСКИЙ сценарий — как реально было у user'а: данные набираются ПОШАГОВО через форму
// (`Input`/`fields.tsx`, `component.setData()` на каждую правку поля/клик «Добавить»), пока
// `Slot` уже смонтирован, а не приезжают одним `setData()` до первого рендера. Предыдущие два
// теста ставили DATA целиком одним вызовом — тест ниже растит `items` по одному, как «Добавить».
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

function WiredSlotDynamic(props: { onGrowDone: () => void }) {
  const data = useAtom(componentDataAtom);
  const component = componentHandle();
  const tagGroups = () => (component.info()?.skin?.forms ?? []).flatMap((f) => f.tags);
  const assemblies = () => component.info()?.editorInfo?.assemblies ?? [];

  let started = false;
  createEffect(() => {
    if (!component.ready() || started) return;
    started = true;
    (async () => {
      component.setData({ label: "Валюта счёта", placeholder: "Не выбрана", items: [] });
      for (let i = 0; i < CURRENCIES.length; i++) {
        await new Promise((r) => setTimeout(r, 10));
        component.setData({
          label: "Валюта счёта",
          placeholder: "Не выбрана",
          items: CURRENCIES.slice(0, i + 1),
        });
      }
      props.onGrowDone();
    })();
  });

  return (
    <For each={tagGroups()}>
      {(tag) => (
        <Slot
          component="select"
          assemblies={assemblies()}
          tag={tag.tag}
          variants={tag.variants}
          data={data()}
          loading={component.loading()}
        />
      )}
    </For>
  );
}

// Голый `Renderer` (без `Slot`) на этом же динамическом сценарии уже доказан отдельно и надёжнее
// — `test/select-incremental-growth.test.tsx`, прямо на движке, без `componentHandle()`'s
// обвязки. Здесь — только то, что специфично для `Slot`/реального `Carousel`.
describe("select — ДИНАМИЧЕСКИЙ набор items (как 'Добавить' по одному, а не setData() целиком)", () => {
  it("через Slot: items растут по одному, потом клик — все 9 на месте?", async () => {
    setCurrentComponent(undefined);
    setCurrentComponent("select");
    let grown = false;

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <WiredSlotDynamic onGrowDone={() => (grown = true)} />, host);

    await waitFor(() => grown, 80);
    expect(grown).toBe(true);

    const trigger = host.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement | null;
    expect(trigger).not.toBeNull();
    trigger!.click();

    await waitFor(() => document.body.querySelectorAll('[data-scope="select"][data-part="item"]').length > 0);
    const items = document.body.querySelectorAll('[data-scope="select"][data-part="item"]');
    expect(items).toHaveLength(9);
  }, 15000);

  it("через Slot: клик СРАЗУ (до конца роста), потом items дорастают — появляются ли новые?", async () => {
    setCurrentComponent(undefined);
    setCurrentComponent("select");
    let grown = false;

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <WiredSlotDynamic onGrowDone={() => (grown = true)} />, host);

    await waitFor(() => host.querySelector('[data-scope="select"][data-part="trigger"]') !== null, 80);
    const trigger = host.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement | null;
    expect(trigger).not.toBeNull();
    trigger!.click();

    await waitFor(() => grown, 80);
    await new Promise((r) => setTimeout(r, 50));

    const items = document.body.querySelectorAll('[data-scope="select"][data-part="item"]');
    expect(items).toHaveLength(9);
  }, 15000);
});
