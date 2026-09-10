// Реальный путь целиком — Input выбирает сохранённый content, componentDataAtom его несёт,
// Slot/Renderer рисуют показ (тот же контракт, каким `pages/showcase` реально зовёт `Slot` —
// `component`/`tag`/`assemblies`/`variants`, не устаревший `slides`, которым звал СНЕСЁННЫЙ
// `widgets/component/preview`). Сеть не трогаем: `@web-core/skin/presets`'s `createPresetsClient`
// замокан на этом уровне (граница ввода-вывода), реальная логика `componentInfo`/`Input`/`Slot`
// остаётся настоящей.
import { useAtom } from "@web-core/store";
import { For } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

// `vi.mock`, а значит и эта фабрика, поднимается ВЫШЕ обычных `import`/`const` — переменные,
// которые фабрика читает, обязаны родиться через `vi.hoisted`, иначе к моменту вызова фабрики их
// ещё не будет (temporal dead zone).
const mockState = vi.hoisted(() => ({
  // Пусто по умолчанию — тест "нет content" ниже полагается на это, тест "есть content" переопределяет.
  contentRecords: [] as readonly unknown[],
  formRecord: {
    id: "test-form",
    label: "button",
    name: "button",
    state: {
      name: "button",
      component: "button",
      recipe: { variants: { primary: {} } },
      variantTags: { primary: ["default"] },
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
        if (kind === "content") return mockState.contentRecords;
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
import { Input } from "#/widgets/component/input";
import { Slot } from "#/entities/showcase";
import { queryClient } from "#/shared/api/query-client";

// jsdom не даёт IntersectionObserver/ResizeObserver — карусель (Slot) заводит их настоящей
// zag-машиной, которая следит за видимостью и размером слайдов. Живому браузеру оба есть, здесь —
// минимальные заглушки, только чтобы карусель могла смонтироваться.
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
  queryClient.clear();
});

function Wired() {
  const data = useAtom(componentDataAtom);
  const component = componentHandle();
  const tagGroups = () => (component.info()?.skin?.forms ?? []).flatMap((f) => f.tags);
  const assemblies = () => component.info()?.editorInfo?.assemblies ?? [];

  return (
    <>
      <Input />
      <For each={tagGroups()}>
        {(tag) => (
          <Slot
            component="button"
            assemblies={assemblies()}
            tag={tag.tag}
            variants={tag.variants}
            data={data()}
            loading={component.loading()}
          />
        )}
      </For>
    </>
  );
}

async function mountAndWaitForRoot(): Promise<() => Element | null> {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <Wired />, host);

  const root = () => host.querySelector('[data-scope="button"][data-part="root"]');
  for (let i = 0; i < 20 && !root(); i++) {
    await new Promise((r) => setTimeout(r, 50));
  }
  return root;
}

describe("Input -> componentDataAtom -> Slot, реальный путь", () => {
  it("сохранённый content долетает до показа текстом", async () => {
    mockState.contentRecords = [
      {
        id: "c1",
        label: "Тестовая кнопка",
        name: "test-button",
        state: { component: "button", data: { label: "Тестовая кнопка" } },
      },
    ];
    setCurrentComponent("button");

    const root = await mountAndWaitForRoot();
    for (let i = 0; i < 20 && root()?.textContent === ""; i++) {
      await new Promise((r) => setTimeout(r, 50));
    }

    expect(root()?.textContent).toBe("Тестовая кнопка");
  }, 15000);

  it("нет сохранённого content — показ не падает, выбор пуст", async () => {
    mockState.contentRecords = [];
    setCurrentComponent("button");

    const root = await mountAndWaitForRoot();

    expect(root()).not.toBeNull();
  }, 15000);
});
