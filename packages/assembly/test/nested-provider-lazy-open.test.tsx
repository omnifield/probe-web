// Репро PWEB-215 — заявка от tree-view (2026-09-15): реальный механизм, найденный живьём в
// браузере (chrome-devtools, `apps/skin`, `/showcase/tree-view/demo`), не через jsdom-догадки.
//
// Узел-лист (0 детей) рисует свой content ГОЛЫМ `<div>{children}</div>` — тем же `props.children`
// геттером (`content-of.tsx`'s `contentOf()`), что и узел-ветка. Как только у него появляется
// ПЕРВЫЙ ребёнок (через `recur`), он одновременно становится веткой — обёртка вокруг ТОГО ЖЕ
// `props.children` меняется на СОВСЕМ ДРУГУЮ (`Collapsible.Content`, заводит свой
// `CollapsibleProvider`). `contentOf()`'s кэш («строили — уже не перестраивай») до фикса переживал
// эту смену как есть: `createRoot` внутри всё ещё нёс владельца от СТАРОЙ, безпровайдерной обёртки
// — новый провайдер снаружи для уже построенного контента не существовал. `useContext` внутри
// content, смонтированного на этом первом (безпровайдерном) заходе, ловил `undefined` НАВСЕГДА —
// не разово мигал, а не самолечился, ровно как в живом репро (в отличие от `date-picker`'s "три
// повтора и стабилизируется").
//
// Голый движок, без Ark/Zag, ОДНА и та же живая реактивная сборка (не два отдельных `render()`) —
// РЕАЛЬНОЕ обновление `AssemblyTree` через сигнал, та же самая инстанция `RenderNode`, тот же
// самый `contentOf()`, что и в бою.

import { createContext, createSignal, Show, useContext, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createRegistry, type AssemblyTree, type Registry } from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

const Ctx = createContext<string>();

/** Лист (0 детей) — голый `<div>{children}</div>`, без provider вовсе. Ветка (1+ детей) — тот же
 * `props.children`, но обёрнутый в СВОЙ provider — та же развилка, что у `TreeContent`'s
 * `<Show when={node().isBranch}>` (ArkBranchContent заводит `CollapsibleProvider`, голый div — нет). */
function LevelItem(props: { children?: JSX.Element; [key: string]: unknown }) {
  const isBranch = () => Boolean(props["data-is-branch"]);
  return (
    <Show when={isBranch()} fallback={<div data-testid="leaf">{props.children}</div>}>
      <Ctx.Provider value="item-1">
        <div data-testid="branch">{props.children}</div>
      </Ctx.Provider>
    </Show>
  );
}

function makeLevelContent(log: { value: string }) {
  return function LevelContent(props: { children?: JSX.Element }) {
    const value = useContext(Ctx);
    log.value = value ?? "ORPHAN";
    return <div data-testid="content">{props.children}</div>;
  };
}

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("узел меняет обёртку вокруг props.children, когда становится веткой (0 детей → 1 ребёнок) — contentOf() не должен нести владельца от старой обёртки", () => {
  it("content, смонтированный ЛИСТОМ, видит provider ветки после того, как та же карточка стала веткой", () => {
    const log = { value: "" };
    const REGISTRY: Registry = createRegistry({
      components: {
        level: {
          passport: {
            component: "level",
            genus: "component",
            anatomy: { keys: () => ["item", "content"] },
            root: "item",
            parts: [{ name: "item" }, { name: "content" }],
          },
          parts: { item: LevelItem, content: makeLevelContent(log) },
        },
      },
      admits: () => true,
    });

    const leafTree: AssemblyTree = {
      components: {
        root: "item-1",
        nodes: {
          "item-1": { id: "item-1", type: "level", parentId: null, children: ["content-1"], props: { "data-is-branch": false } },
          "content-1": { id: "content-1", type: "level.content", parentId: "item-1", children: [] },
        },
      },
    };

    const [tree, setTree] = createSignal<AssemblyTree>(leafTree);
    const errors: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <RenderTree
          registry={REGISTRY}
          tree={tree()}
          errorFallback={(p) => {
            errors.push(p.error);
            return null;
          }}
        />
      ),
      host,
    );

    expect(host.querySelector('[data-testid="leaf"]')).not.toBeNull();
    expect(log.value).toBe("ORPHAN"); // лист: снаружи никакого provider и не должно быть — честно

    // Та же карточка (СВЯЗАННЫЕ данные, не новый маунт) получает ребёнка и становится веткой — тем
    // же переходом, каким `tree-view`'s узел "a" получает первого `recur`-ребёнка.
    setTree({
      components: {
        root: "item-1",
        nodes: {
          "item-1": { id: "item-1", type: "level", parentId: null, children: ["content-1"], props: { "data-is-branch": true } },
          "content-1": { id: "content-1", type: "level.content", parentId: "item-1", children: [] },
        },
      },
    });

    expect(errors).toEqual([]);
    expect(host.querySelector('[data-testid="branch"]')).not.toBeNull();
    expect(log.value).toBe("item-1");
  });
});
