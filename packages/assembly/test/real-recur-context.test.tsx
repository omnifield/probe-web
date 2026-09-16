// Третья попытка поймать живой tree-view баг (ROADMAP.yaml,
// composite-context-lost-for-label-control-positioner-recurrence) — двум предыдущим синтетическим
// репро (nested-provider-lazy-open, suspense-recur-context) это не удалось. Разница здесь: дерево
// растёт ЧЕРЕЗ РЕАЛЬНЫЙ `baseAssemblyOf`/`expand.ts` (recur на самом `root`-узле паспорта, как у
// tree-view — `item` рекурсирует сам в себя через `content`), а не через вручную собранный
// `AssemblyTree`-литерал по кускам. Проверяет: не в СПОСОБЕ роста ли (`nameFor()`'s счётчик имён,
// полная пересборка дерева иммутабельно на каждое изменение данных) дело.

import { createContext, createMemo, createSignal, useContext, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { baseAssemblyOf, createRegistry, type GrowablePassport, type Registry } from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

const Ctx = createContext<string>();

function LevelItem(props: { children?: JSX.Element; [key: string]: unknown }) {
  const id = () => String(props["data-node"] ?? "?");
  return (
    <Ctx.Provider value={id()}>
      <div data-testid={`item-${id()}`}>{props.children}</div>
    </Ctx.Provider>
  );
}

function makeLevelContent(log: Map<string, string>) {
  return function LevelContent(props: { children?: JSX.Element; [key: string]: unknown }) {
    const value = useContext(Ctx);
    log.set(String(props["data-node"] ?? "?"), value ?? "ORPHAN");
    return <div data-testid={`content-${String(props["data-node"])}`}>{props.children}</div>;
  };
}

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("recur через РЕАЛЬНЫЙ expand.ts — item рекурсирует сам в себя через content, как tree-view", () => {
  it("content, чей recur-ребёнок вырос через настоящий baseAssemblyOf, видит provider своего предка", async () => {
    const log = new Map<string, string>();

    const passport: GrowablePassport = { component: "level", root: "item", anatomy: { keys: () => ["item", "content"] } };
    const template = {
      name: "level-base",
      means: "proof",
      tree: {
        node: "item",
        children: [{ node: "content", children: [] as [] }],
        recur: { path: "children", into: "content" },
      },
    };

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

    const [data, setData] = createSignal<{ children: unknown[] }>({ children: [] });
    const tree = createMemo(() => baseAssemblyOf(passport, template, "level", data()));

    const errors: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <RenderTree
          registry={REGISTRY}
          tree={tree()}
          data={data()}
          errorFallback={(p) => {
            errors.push(p.error);
            return null;
          }}
        />
      ),
      host,
    );

    await Promise.resolve();
    expect(errors).toEqual([]);

    // Реальный recur-рост: 0 → 1 → 2 детей, каждый раз ПОЛНАЯ иммутабельная пересборка дерева —
    // тем же способом, каким редактор в apps/skin меняет `items` и заново зовёт `baseAssemblyOf`.
    setData({ children: [{}] });
    await Promise.resolve();
    expect(errors).toEqual([]);

    setData({ children: [{}, {}] });
    await Promise.resolve();

    expect(errors).toEqual([]);
    for (const [contentId, ctxValue] of log) {
      expect(ctxValue, `узел «${contentId}» остался сиротой`).not.toBe("ORPHAN");
    }
  });
});
