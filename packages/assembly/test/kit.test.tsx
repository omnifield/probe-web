// Механика на ЖИВОМ ките: настоящая кнопка, настоящий паспорт, настоящее правило допуска.
//
// Остальные пробы отрисовки держат свои компоненты — так они проверяют механику, а не кит.
// Здесь наоборот, и предмет ровно один: свойства, которыми механика ПОЛЬЗУЕТСЯ, но которыми не
// владеет.
//
//   • признак узла (`data-node`) доезжает до разметки только потому, что кит прозрачен —
//     произвольные пропы он форвардит на свой узел. Перестанет — вторая область адреса
//     (правка образца по идентификатору) молча перестанет существовать в разметке, а запись
//     останется, и чинить будут генератор;
//   • адресные атрибуты кита (`data-scope`/`data-part`) на узле сохраняются: признак механики
//     их не вытесняет. Разъедься это — координата и идентификатор перестали бы быть двумя
//     областями ОДНОГО узла.
//
// Кит здесь — `devDependency`; в поставку механики он не едет.

import { Button } from "@omnifield/probe-web-ui";
import { passportOf, admits } from "@omnifield/probe-web-ui/passport";
import { afterEach, describe, expect, it } from "vitest";

import type { ReadablePassport } from "../src/passport-read.js";
import { createRegistry } from "../src/registry.js";
import { RenderTree } from "../src/render.jsx";
import type { AssemblyTree } from "../src/tree.js";
import { cleanup, mount } from "./dom.jsx";

afterEach(cleanup);

const registry = createRegistry({
  components: { button: Button },
  passports: { button: passportOf("button") as ReadablePassport },
  admits,
});

const tree: AssemblyTree = {
  components: {
    root: "сохранить",
    nodes: {
      сохранить: {
        id: "сохранить",
        type: "button",
        parentId: null,
        children: [],
        props: { children: "Сохранить" },
      },
    },
  },
};

describe("дерево из настоящих компонентов кита", () => {
  it("рисуется по данным", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const button = host.querySelector("button");

    expect(button).not.toBeNull();
    expect(button?.textContent).toBe("Сохранить");
  });

  it("узел адресуем в разметке: признак механики долетает через кит", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);

    expect(host.querySelector("button")?.getAttribute("data-node")).toBe("сохранить");
  });

  it("адрес кита на узле остаётся — координата и идентификатор живут вместе", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const button = host.querySelector("button") as HTMLElement;

    expect(button.getAttribute("data-scope")).toBe("button");
    expect(button.getAttribute("data-part")).toBe("root");
    expect(button.getAttribute("data-node")).toBe("сохранить");
  });

  it("украшенный узел подписан так же — путь редактора не меняет адресации", () => {
    const host = mount(() => (
      <RenderTree
        tree={tree}
        registry={registry}
        editOverlay={(props) => <i data-overlay={props.nodeId} />}
      />
    ));
    const button = host.querySelector("button") as HTMLElement;

    expect(button.getAttribute("data-node")).toBe("сохранить");
    expect(button.getAttribute("data-scope")).toBe("button");
    expect(button.querySelector("[data-overlay]")).not.toBeNull();
  });
});
