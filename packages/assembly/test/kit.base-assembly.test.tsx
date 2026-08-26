// БАЗОВАЯ СБОРКА ПОСТАВЩИКА — зеркальная проба (`PWEB-90`).
//
// Паспорт везёт готовое дерево рабочего экземпляра (`PWEB-89`): у гармошки — три раздела, первый
// раскрыт, `value` у каждого. Прежде это выдумывал потребитель: сколько разделов и какие пропы
// дать киту, чтобы тот заработал. Знание поставщика жило у витрины, и каждая витрина писала своё.
//
// ## Почему проба здесь
//
// Кит доказал, что запись сходится с паспортом и поднимается ЕГО собственным обходом. Чего он
// доказать не может: что сборку примет `RenderTree`. Зависеть на механику кит не вправе даже
// пробами — механика уже зависит на кит, и встречная зависимость замкнула бы граф. Поэтому
// проверяет тот, кто отрисовывает.
//
// Предмет — ЧУЖАЯ сборка, а не похожая на неё: дерево здесь не пишется, оно приходит из паспорта
// целиком. Своя фикстура была бы зелёной ровно в той мере, в какой я угадал бы форму поставщика.
//
// ## Что доказывается
//
// Сборка ложится в дерево механики БЕЗ переклада (присваивание к `AssemblyTree` — это и есть
// проверка совпадения двух узких записей), проходит нашу же проверку целостности, рисуется
// `RenderTree` и даёт узлы, адресуемые координатами анатомии. Отдельно — что раскрытость первого
// раздела приезжает из сборки: это работа `value`, того самого пропа, ради которого сборка и
// приехала от поставщика.
//
// Кит здесь — `devDependency`; в поставку механики он не едет (проба на направление —
// `surface.test.ts`).

import { admits, baseAssemblyOf, editorInfoOf, passportOf } from "@omnifield/probe-web-ui/passport";
import { afterEach, describe, expect, it } from "vitest";

import { coordinateOfType } from "../src/coordinate.js";
import { checkTree } from "../src/integrity.js";
import { createRegistry, resolveComponent } from "../src/registry.js";
import { RenderTree } from "../src/render.jsx";
import { isContent, type AssemblyTree } from "../src/tree.js";
import { cleanup, mount } from "./dom.jsx";
import { readableKitComponent } from "./kit-readable-component.js";

afterEach(cleanup);

/** Паспорт гармошки — первый компонент кита, объявивший базовую сборку. */
const passport = passportOf("accordion");
if (!passport) throw new Error("кит не отдаёт паспорта гармошки");

/**
 * Сборки поставщика держит срез РЕДАКТОРА (`PassportEditorInfo.assemblies`, `PWEB-115`), не
 * рантайм-паспорт: `baseAssemblyOf` теперь принимает сборку параметром, а не снимает её с
 * паспорта. Первая в перечне — «три раздела, первый раскрыт», её и проверяет эта проба.
 */
const editorInfo = editorInfoOf("accordion");
const базовая = editorInfo?.assemblies[0];
if (!базовая) throw new Error("срез редактора гармошки не объявил базовой сборки");

/**
 * Сборка поставщика, приведённая к дереву механики.
 *
 * Присваивание и есть проверка формы: кит объявил у себя узкую запись того, что механика
 * принимает (`BaseAssemblyTree`), механика — узкую запись того, что она с паспорта снимает
 * (`ReadablePassport`). Разъедься эти две записи — здесь не собрались бы типы, и узнали бы мы об
 * этом в прогоне, а не у потребителя.
 *
 * @param address адрес компонента в реестре — вход, а не константа: кит может лежать под чужим
 *   пространством имён
 */
const сборка = (address?: string): AssemblyTree => baseAssemblyOf(passport, базовая, address);

/** Реестр из пары поставщика; адрес задаёт вызывающий — им же адресуются части сборки. */
const реестр = (address = "accordion") =>
  createRegistry({
    components: { [address]: readableKitComponent("accordion") },
    admits,
  });

/** Начертание части в разметке: `itemTrigger` → `item-trigger`. Берётся у анатомии, не руками. */
const начертание = (part: string): string =>
  (passport.anatomy.build() as Record<string, { attrs: Record<string, string> }>)[part]?.attrs[
    "data-part"
  ] as string;

describe("сборка поставщика ложится в дерево механики", () => {
  it("проходит нашу же проверку целостности — изъянов нет", () => {
    // Целостность проверяет ДЕРЕВО о нём самом: сходятся ли ссылки, достижимы ли узлы. Дерево
    // чужой сборки обязано быть законным по нашим правилам, иначе принимать его нечем.
    expect(checkTree(сборка())).toEqual([]);
  });

  it("каждый её узел разрешается в компонент по своему адресу", () => {
    const registry = реестр();

    for (const node of Object.values(сборка().components.nodes)) {
      if (isContent(node)) continue;
      expect(resolveComponent(registry, node.type)).toBeTypeOf("function");
    }
  });
});

describe("`RenderTree` рисует базовую сборку", () => {
  it("узлы на месте: три раздела со своими кнопками, указателями и содержимым", () => {
    const host = mount(() => <RenderTree tree={сборка()} registry={реестр()} />);

    expect(host.querySelectorAll(`[data-part="${начертание("item")}"]`)).toHaveLength(3);
    expect(host.querySelectorAll(`[data-part="${начертание("itemTrigger")}"]`)).toHaveLength(3);
    expect(host.querySelectorAll(`[data-part="${начертание("itemIndicator")}"]`)).toHaveLength(3);
    expect(host.querySelectorAll(`[data-part="${начертание("itemContent")}"]`)).toHaveLength(3);
  });

  it("содержимое сборки доехало до разметки — подписи и указатели", () => {
    const host = mount(() => <RenderTree tree={сборка()} registry={реестр()} />);
    const подписи = [...host.querySelectorAll(`[data-part="${начертание("itemTrigger")}"]`)].map(
      (узел) => узел.textContent,
    );

    expect(подписи).toEqual(["Раздел 1⌄", "Раздел 2⌄", "Раздел 3⌄"]);
  });

  it("каждая часть адресуема координатой анатомии — и той же, что даёт механика", () => {
    const registry = реестр();
    const tree = сборка();
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);

    for (const node of Object.values(tree.components.nodes)) {
      if (isContent(node)) continue;

      const координата = coordinateOfType(registry, node.type);
      const узел = host.querySelector(`[data-node="${node.id}"]`);

      expect(координата).toBeDefined();
      expect(узел).not.toBeNull();
      expect(узел?.getAttribute("data-scope")).toBe(координата?.component);
      expect(узел?.getAttribute("data-part")).toBe(начертание(координата?.part ?? ""));
    }
  });

  it("первый раздел раскрыт, остальные закрыты — это работа `value` из сборки", () => {
    // Ради этого сборка и приехала от поставщика: `defaultValue` корня называет `value` раздела,
    // и без пропа, который знает только автор компонента, гармошка стоит закрытой целиком.
    const host = mount(() => <RenderTree tree={сборка()} registry={реестр()} />);
    const разделы = [...host.querySelectorAll(`[data-part="${начертание("item")}"]`)];

    expect(разделы.map((раздел) => раздел.getAttribute("data-state"))).toEqual([
      "open",
      "closed",
      "closed",
    ]);
  });

  it("раскрытое содержимое видно, закрытое — спрятано, а узлы на месте оба", () => {
    const host = mount(() => <RenderTree tree={сборка()} registry={реестр()} />);
    const области = [...host.querySelectorAll(`[data-part="${начертание("itemContent")}"]`)];

    expect(области[0]?.hasAttribute("hidden")).toBe(false);
    expect(области[1]?.hasAttribute("hidden")).toBe(true);
    expect(области[0]?.textContent).toBe("Здесь лежит то, что раскрывают.");
  });

  it("адрес компонента — вход: под чужим пространством имён рисуется так же", () => {
    const host = mount(() => (
      <RenderTree tree={сборка("ui.accordion")} registry={реестр("ui.accordion")} />
    ));

    expect(host.querySelectorAll(`[data-part="${начертание("item")}"]`)).toHaveLength(3);
    // Адрес узла в дереве сменился, а координата — нет: `data-scope` ставит кит по анатомии.
    expect(host.querySelector(`[data-part="${начертание("item")}"]`)?.getAttribute("data-scope"))
      .toBe("accordion");
  });
});
