// Правки: дерево меняется, недопустимое отвергается по имени, прежнее дерево не трогается.

import { describe, expect, it } from "vitest";

import { insertNode, moveNode, removeNode, updateNode } from "../src/edits.js";
import { createRegistry } from "../src/registry.js";
import { nodeOf, type AssemblyTree } from "../src/tree.js";
import { spec } from "./passports.js";

const Component = () => null;

const registry = createRegistry(
  spec({
    layout: Component,
    button: Component,
    icon: Component,
    accordion: { item: Component, itemTrigger: Component },
  }),
);

const base: AssemblyTree = {
  components: {
    root: "page",
    nodes: {
      page: { id: "page", type: "layout", parentId: null, children: ["one", "two"] },
      one: { id: "one", type: "button", parentId: "page", children: ["mark"] },
      mark: { id: "mark", type: "icon", parentId: "one", children: [] },
      two: { id: "two", type: "button", parentId: "page", children: [] },
    },
  },
};

/** Дерево из ответа правки; падает с внятным текстом, если правка отказала. */
function grown(result: ReturnType<typeof insertNode>): AssemblyTree {
  if (!result.ok) throw new Error(`правка отказала: ${result.refusal} — ${result.means}`);
  return result.tree;
}

describe("вставка", () => {
  it("кладёт узел внутрь владельца и проставляет связи в обе стороны", () => {
    const tree = grown(insertNode(base, registry, { id: "three", type: "button" }, "page"));

    expect(nodeOf(tree, "three")).toMatchObject({ parentId: "page", children: [] });
    expect(nodeOf(tree, "page")?.children).toEqual(["one", "two", "three"]);
  });

  it("кладёт на указанное место, а место за краем прижимает к краю", () => {
    expect(
      grown(insertNode(base, registry, { id: "x", type: "button" }, "page", 0)).components.nodes
        .page.children,
    ).toEqual(["x", "one", "two"]);

    expect(
      grown(insertNode(base, registry, { id: "x", type: "button" }, "page", 99)).components.nodes
        .page.children,
    ).toEqual(["one", "two", "x"]);
  });

  it("прежнее дерево не трогает", () => {
    insertNode(base, registry, { id: "three", type: "button" }, "page");
    expect(base.components.nodes.page.children).toEqual(["one", "two"]);
    expect(nodeOf(base, "three")).toBeUndefined();
  });

  it("отвергает недопустимую вложенность именем отказа паспорта", () => {
    const result = insertNode(base, registry, { id: "inside", type: "button" }, "mark");
    expect(result).toMatchObject({ ok: false, refusal: "content-not-admitted" });
  });

  it("отвергает занятое имя и несуществующего владельца", () => {
    expect(insertNode(base, registry, { id: "one", type: "button" }, "page")).toMatchObject({
      refusal: "id-taken",
    });
    expect(insertNode(base, registry, { id: "n", type: "button" }, "нет")).toMatchObject({
      refusal: "parent-unknown",
    });
  });

  it("переносит объявленные пропы и редакторское, не выдумывая пустых", () => {
    const tree = grown(
      insertNode(
        base,
        registry,
        { id: "rich", type: "button", props: { children: "Сохранить" }, meta: { свёрнут: true } },
        "page",
      ),
    );

    expect(nodeOf(tree, "rich")).toMatchObject({
      props: { children: "Сохранить" },
      meta: { свёрнут: true },
    });
  });

  it("вида у узла нет вовсе — он приходит правилами, а не пропом", () => {
    const tree = grown(insertNode(base, registry, { id: "плоский", type: "button" }, "page"));

    // Поле `styles` снято (`PWEB-27`): карта по идентификатору узла не рецепт и не скин, а
    // встроенный стиль перебивал бы любой скин навсегда.
    expect(nodeOf(tree, "плоский")).not.toHaveProperty("styles");
  });
});

describe("удаление", () => {
  it("уносит поддерево целиком и снимает ссылку у владельца", () => {
    const tree = grown(removeNode(base, "one"));

    expect(nodeOf(tree, "one")).toBeUndefined();
    expect(nodeOf(tree, "mark")).toBeUndefined();
    expect(nodeOf(tree, "page")?.children).toEqual(["two"]);
  });

  it("корень не удаляется — без него дерева не останется", () => {
    expect(removeNode(base, "page")).toMatchObject({ ok: false, refusal: "root-locked" });
  });

  it("несуществующий узел — отказ, а не тихое согласие", () => {
    expect(removeNode(base, "нет")).toMatchObject({ refusal: "node-unknown" });
  });
});

describe("перенос", () => {
  it("переносит узел к другому владельцу", () => {
    const tree = grown(moveNode(base, registry, "mark", "two"));

    expect(nodeOf(tree, "mark")?.parentId).toBe("two");
    expect(nodeOf(tree, "one")?.children).toEqual([]);
    expect(nodeOf(tree, "two")?.children).toEqual(["mark"]);
  });

  it("переносит внутри одного владельца, не удваивая узел", () => {
    const tree = grown(moveNode(base, registry, "two", "page", 0));

    expect(nodeOf(tree, "page")?.children).toEqual(["two", "one"]);
  });

  it("отвергает перенос узла внутрь самого себя и внутрь своего потомка", () => {
    expect(moveNode(base, registry, "one", "one")).toMatchObject({ refusal: "into-own-subtree" });
    expect(moveNode(base, registry, "one", "mark")).toMatchObject({ refusal: "into-own-subtree" });
  });

  it("отвергает перенос корня и проверяет вложенность на новом месте", () => {
    expect(moveNode(base, registry, "page", "one")).toMatchObject({ refusal: "root-locked" });

    const intoIcon = moveNode(base, registry, "two", "mark");
    expect(intoIcon).toMatchObject({ ok: false, refusal: "content-not-admitted" });
  });
});

describe("правка узла", () => {
  it("заменяет названное поле целиком и не трогает остальные", () => {
    const first = grown(updateNode(base, "one", { props: { children: "Да" } }));
    const second = grown(updateNode(first, "one", { meta: { свёрнут: true } }));

    expect(nodeOf(second, "one")).toMatchObject({
      props: { children: "Да" },
      meta: { свёрнут: true },
      children: ["mark"],
      parentId: "page",
    });
  });

  it("названное поле со значением `undefined` — это снятие", () => {
    const withProps = grown(updateNode(base, "one", { props: { children: "Да" } }));
    const cleared = grown(updateNode(withProps, "one", { props: undefined }));

    expect(nodeOf(cleared, "one")?.props).toBeUndefined();
  });

  it("несуществующий узел — отказ", () => {
    expect(updateNode(base, "нет", { props: {} })).toMatchObject({ refusal: "node-unknown" });
  });
});

describe("композиция", () => {
  // «Кнопка, вставленная в триггер всплывающего окна» — один узел с двумя принадлежностями:
  // адрес и вид у кнопки, поведение и состояние у триггера.
  const страница: AssemblyTree = {
    components: {
      root: "стр",
      nodes: {
        стр: { id: "стр", type: "layout", parentId: null, children: ["окно", "окно2"] },
        окно: { id: "окно", type: "popover", parentId: "стр", children: [] },
        окно2: { id: "окно2", type: "popover", parentId: "стр", children: [] },
      },
    },
  };

  it("узел несёт адрес кнопки и указание, во что она вставлена", () => {
    const tree = grown(
      insertNode(
        страница,
        registry,
        { id: "настройки", type: "button", composedInto: "popover.trigger" },
        "окно",
      ),
    );

    expect(nodeOf(tree, "настройки")).toMatchObject({
      type: "button",
      composedInto: "popover.trigger",
      parentId: "окно",
    });
    expect(nodeOf(tree, "окно")?.children).toEqual(["настройки"]);
  });

  it("место в дереве проверяется по ВНЕШНЕМУ адресу, а не по внутреннему", () => {
    // Кнопку раскладка пускает, а вот триггер чужого компонента сам по себе в неё не кладётся:
    // место занимает именно он.
    expect(insertNode(страница, registry, { id: "н", type: "button" }, "стр").ok).toBe(true);
    expect(
      insertNode(
        страница,
        registry,
        { id: "н", type: "button", composedInto: "popover.trigger" },
        "стр",
      ),
    ).toMatchObject({ ok: false, refusal: "foreign-part" });
  });

  it("без композиции кнопку внутрь окна не положить — там место только под части", () => {
    // Обратная сторона того же: узел, не ставший триггером, в окне не помещается вовсе.
    expect(insertNode(страница, registry, { id: "н", type: "button" }, "окно")).toMatchObject({
      ok: false,
      refusal: "content-not-admitted",
    });
  });

  it("сама композиция проверяется по паспорту внешнего", () => {
    // Место допустимо — вкладка гармошки лежит в гармошке, — но внутрь вкладки идут только её
    // части, и компонент туда не вставить.
    const гармошка: AssemblyTree = {
      components: {
        root: "г",
        nodes: { г: { id: "г", type: "accordion", parentId: null, children: [] } },
      },
    };

    const result = insertNode(
      гармошка,
      registry,
      { id: "н", type: "button", composedInto: "accordion.item" },
      "г",
    );

    expect(result).toMatchObject({ ok: false, refusal: "content-not-admitted" });
    expect(result.ok === false && result.means).toContain("вставить «button» в «accordion.item»");
  });

  it("неизвестный внешний адрес отвергается, а не принимается молча", () => {
    expect(
      insertNode(
        страница,
        registry,
        { id: "н", type: "button", composedInto: "нет.такого" },
        "окно",
      ),
    ).toMatchObject({ ok: false, refusal: "child-unknown" });
  });

  it("перенос составного узла проверяется так же", () => {
    const собрано = grown(
      insertNode(
        страница,
        registry,
        { id: "настройки", type: "button", composedInto: "popover.trigger" },
        "окно",
      ),
    );

    // В другое окно — можно: там тоже есть место под триггер.
    const переехало = grown(moveNode(собрано, registry, "настройки", "окно2"));
    expect(nodeOf(переехало, "настройки")?.parentId).toBe("окно2");
    expect(nodeOf(переехало, "настройки")?.composedInto).toBe("popover.trigger");

    // А в раскладку — нельзя: место под триггер там не объявлено.
    expect(moveNode(собрано, registry, "настройки", "стр")).toMatchObject({
      ok: false,
      refusal: "foreign-part",
    });
  });

  it("обычный узел поля не получает — пустого места в данных не заводится", () => {
    const tree = grown(insertNode(страница, registry, { id: "просто", type: "button" }, "стр"));

    expect(nodeOf(tree, "просто")).not.toHaveProperty("composedInto");
  });
});
