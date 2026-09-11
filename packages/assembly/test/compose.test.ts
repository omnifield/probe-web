// Проба compose.ts (rootNode/composeTree) — первая целиком безбраузерная (`model`-проект,
// node-окружение) проба движка сборки в этом пакете: предмет — правило вложенности и накопление
// отказов, ни DOM, ни Solid тут ни при чём.
//
// `admits` — своя маленькая копия реальной семантики (`packages/skin/src/engine/passport/
// assembly/admission.ts`): пустой `accepts` пропускает всё, иначе матчится kind/genus/name.
// Пакет `assembly` правило вложенности не хранит сам (FAQ.md, «Реестр и вложенность») — тест
// подаёт его тем же третьим входом `createRegistry`, каким его подаёт настоящий кит.

import { describe, expect, it } from "vitest";

import {
  composeTree,
  createRegistry,
  rootNode,
  type Admission,
  type ReadablePart,
  type Registry,
} from "../src/index.js";

function admits(part: ReadablePart, candidate: Admission): boolean {
  const accepts = part.accepts;
  if (!accepts) return true;

  return accepts.some((allowed) => {
    if (candidate.kind === "content") {
      return allowed.kind === "content" && allowed.genus === candidate.genus;
    }
    return (
      allowed.kind === "component" &&
      (allowed.genus === undefined || candidate.genus === undefined || allowed.genus === candidate.genus) &&
      (allowed.name === undefined || allowed.name === candidate.name)
    );
  });
}

const REGISTRY: Registry = createRegistry({
  admits,
  components: {
    grid: {
      passport: {
        component: "grid",
        genus: "component",
        anatomy: { keys: () => ["root", "cell"] },
        root: "root",
        parts: [
          { name: "root", accepts: [{ kind: "component", name: "cell" }] },
          { name: "cell", accepts: [{ kind: "component" }, { kind: "content", genus: "text" }] },
        ],
      },
      parts: {},
    },
    card: {
      passport: {
        component: "card",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [{ name: "root" }],
      },
      parts: {},
    },
    button: {
      passport: {
        component: "button",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [{ name: "root" }],
      },
      parts: {},
    },
  },
});

describe("rootNode — первый узел дерева, родителя проверять не у чего", () => {
  it("адрес известен реестру — дерево из одного корневого узла", () => {
    const tree = rootNode(REGISTRY, "grid");
    expect(tree).toEqual({
      components: { root: "grid", nodes: { grid: { id: "grid", type: "grid", parentId: null, children: [] } } },
    });
  });

  it("свой id — использован вместо адреса", () => {
    const tree = rootNode(REGISTRY, "grid", "module-1");
    expect(tree?.components.root).toBe("module-1");
    expect(tree?.components.nodes["module-1"]).toMatchObject({ type: "grid" });
  });

  it("адрес реестру неизвестен — undefined, не бросок", () => {
    expect(rootNode(REGISTRY, "unknown")).toBeUndefined();
  });
});

describe("composeTree — модуль из целых компонентов, тем же insertNode, что и ручная правка", () => {
  it("вложенная композиция строится целиком, bind/on/props доезжают до узлов", () => {
    const result = composeTree(REGISTRY, {
      type: "grid",
      props: { columns: 2 },
      children: [
        {
          type: "grid.cell",
          children: [{ type: "card", bind: { title: "/product/name" } }],
        },
        {
          type: "grid.cell",
          children: [
            {
              type: "button",
              props: { "data-variant": "primary" },
              on: { click: { event: { name: "add-to-cart" } } },
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { nodes, root } = result.tree.components;
    expect(root).toBe("grid");
    expect(nodes.grid).toMatchObject({ type: "grid", props: { columns: 2 }, children: ["grid.cell", "grid.cell-2"] });
    expect(nodes["grid.cell"]).toMatchObject({ type: "grid.cell", parentId: "grid", children: ["grid.cell.card"] });
    expect(nodes["grid.cell.card"]).toMatchObject({ type: "card", bind: { title: "/product/name" } });
    expect(nodes["grid.cell-2.button"]).toMatchObject({
      type: "button",
      props: { "data-variant": "primary" },
      on: { click: { event: { name: "add-to-cart" } } },
    });
  });

  it("свой id узла уважается, авто-имя не трогает его", () => {
    const result = composeTree(REGISTRY, {
      type: "grid",
      children: [{ type: "grid.cell", id: "hero", children: [{ type: "card", id: "hero-card" }] }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tree.components.nodes.hero).toBeDefined();
    expect(result.tree.components.nodes["hero-card"]).toMatchObject({ type: "card", parentId: "hero" });
  });

  it("содержимое (genus/value) кладётся тем же путём, что и компонент", () => {
    const result = composeTree(REGISTRY, {
      type: "grid",
      children: [{ type: "grid.cell", children: [{ genus: "text", value: "Заголовок" }] }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tree.components.nodes["grid.cell.content"]).toMatchObject({
      genus: "text",
      value: "Заголовок",
    });
  });

  it("корень — неизвестный реестру адрес: один отказ, дерева нет", () => {
    const result = composeTree(REGISTRY, { type: "unknown" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0]).toMatchObject({ id: "unknown", refusal: "parent-unknown" });
    expect(result.refusals[0]?.means).toContain("unknown");
  });

  it("отказ одного узла не останавливает сборку остальных — все отказы собраны разом, ветка отказавшего не растится", () => {
    const result = composeTree(REGISTRY, {
      type: "grid",
      children: [
        // grid.root admits ТОЛЬКО component name:"cell" — прямой button сюда не встаёт
        { type: "button", children: [{ type: "card" }] },
        { type: "grid.cell", children: [{ type: "card" }] },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Ровно один отказ — на самой кнопке, не на её ребёнке (card под ней не пытались класть).
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0]).toMatchObject({ id: "grid.button", refusal: "component-not-admitted" });
  });
});
