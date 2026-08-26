// Пробы потока — рядом с самим компонентом.
//
// Поведения у раскладки нет, и проверяется здесь другое: что в разметке НЕ появилось ни одного
// раскладочного значения, что вложенность объявлена так же, как она выглядит на живом узле, и
// что несколько элементов дают одну координату — то есть скин одевает их одним правилом.

import { afterEach, describe, expect, it } from "vitest";

import {
  coordinateOf,
  skinGaps,
  type Outfit,
  type PassportLookup,
} from "@omnifield/probe-web-skin/model";
import { cleanup, mount, one } from "../../test/dom.jsx";
import { palette } from "../../test/palette.js";
import { assemble, generateSkinCss } from "../../test/skin.js";
import { anatomy, editorInfo, parts, passport } from "./flow.anatomy.js";
import { Flow, FlowItem } from "./flow.jsx";
import { form } from "./flow.recipe.js";

afterEach(cleanup);

const lookup: PassportLookup = (component) =>
  component === passport.component ? passport : undefined;

const attributesOf = (node: Element) => [...node.attributes].map((a) => a.name).sort();

/** Узлы части — по её же адресу из анатомии. */
const узлы = (host: ParentNode, part: keyof typeof parts) => [
  ...host.querySelectorAll(`[data-part="${parts[part].attrs["data-part"]}"]`),
];

describe("Flow", () => {
  it("рендерит ОДИН узел и ничего вокруг", () => {
    const host = mount(() => (
      <Flow>
        <span>Отмена</span>
        <span>Сохранить</span>
      </Flow>
    ));

    expect(host.children.length).toBe(1);
    expect(узлы(host, "root").length).toBe(1);
  });

  it("в разметке НЕТ ни направления, ни зазора, ни выравнивания", () => {
    // Главная проба компонента: раскладочные свойства — вид, и приезжают они скином по адресу.
    // Появись здесь хоть одно значение — приложение стало бы раскладывать себя само, и смена
    // скина раскладку бы не меняла.
    const host = mount(() => (
      <Flow>
        <FlowItem>поле</FlowItem>
      </Flow>
    ));

    expect(attributesOf(узлы(host, "root")[0])).toEqual(["data-part", "data-scope"]);
    expect(attributesOf(узлы(host, "item")[0])).toEqual(["data-part", "data-scope"]);
  });

  it("элемент потока — свой узел со своим адресом", () => {
    const host = mount(() => (
      <Flow>
        <FlowItem>поле</FlowItem>
        <span>кнопка</span>
      </Flow>
    ));

    expect(узлы(host, "item").length).toBe(1);
    expect(узлы(host, "item")[0].getAttribute("data-scope")).toBe("flow");
  });

  it("тег выбирает потребитель, адрес остаётся на месте", () => {
    const host = mount(() => <Flow as="nav">ссылки</Flow>);

    expect(one(host, "nav").getAttribute("data-part")).toBe("root");
  });
});

describe("паспорт потока", () => {
  it("каждая часть анатомии появляется в документе — её же атрибутами", () => {
    const host = mount(() => (
      <Flow>
        <FlowItem>поле</FlowItem>
      </Flow>
    ));

    for (const part of anatomy.keys()) {
      expect(узлы(host, part).length).toBeGreaterThan(0);
      expect(узлы(host, part)[0].getAttribute("data-scope")).toBe(passport.component);
    }
  });

  it("объявленная вложенность совпадает с живой разметкой", () => {
    const host = mount(() => (
      <Flow>
        <FlowItem>поле</FlowItem>
      </Flow>
    ));

    const объявлено = (editorInfo.parts.root?.accepts ?? []).some(
      (a) => a.kind === "part" && a.name === "item",
    );

    expect(объявлено).toBe(true);
    expect(узлы(host, "root")[0].querySelector('[data-part="item"]')).not.toBeNull();
  });

  it("предок элемента читается НАЗАД — из объявленного содержимого", () => {
    const host = mount(() => (
      <Flow>
        <FlowItem>поле</FlowItem>
      </Flow>
    ));

    expect(coordinateOf(узлы(host, "item")[0], lookup)?.ancestor).toEqual({
      component: "flow",
      part: "root",
      states: [],
    });
  });

  it("несколько элементов дают ОДНУ координату — одевает их одно правило", () => {
    const host = mount(() => (
      <Flow>
        <FlowItem>первый</FlowItem>
        <FlowItem>второй</FlowItem>
      </Flow>
    ));

    const координаты = узлы(host, "item").map((node) => coordinateOf(node, lookup));

    expect(координаты.length).toBe(2);
    expect(координаты[0]).toEqual(координаты[1]);
  });

  it("состояний нет ни у одной части, группа и род объявлены", () => {
    for (const part of passport.parts) expect(part.states).toEqual([]);

    expect(editorInfo.group).toBe("layout");
    expect(editorInfo.genus).toBe("component");
  });
});

// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`, `flow.recipe.ts`): компонент доказывает себя сам — паспорт
// потока МОЖНО одеть настоящей механикой скина целиком.
describe("рецепт-доказательство: паспорт МОЖНО одеть целиком", () => {
  const outfit: Outfit = { name: "проба", palette: palette.name, forms: [form.name] };
  const { skin } = assemble(outfit, { palettes: [palette], forms: [form] });

  it("покрытие полное — ни одной непокрытой координаты паспорта", () => {
    expect(skinGaps(skin, [passport])).toEqual([]);
  });

  it("CSS действительно порождается, а не только собирается типами", () => {
    expect(generateSkinCss(skin).length).toBeGreaterThan(0);
  });
});
