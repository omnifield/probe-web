// Пробы сетки — рядом с самим компонентом.
//
// Отдельно от потока проверяется то, ради чего сетка вообще заведена вторым компонентом
// раскладки: её ячейка — ДРУГАЯ координата, а не та же самая с другим именем вариации. Если бы
// раскладка была одна, правило «ячейка сетки размещается так-то» стало бы неотличимо от правила
// для элемента потока: вариации предка в адресе нет.

import { afterEach, describe, expect, it } from "vitest";

import {
  coordinateOf,
  partOf,
  skinGaps,
  type Outfit,
  type PassportLookup,
} from "@omnifield/probe-web-skin/model";
import { cleanup, mount, one } from "../../test/dom.jsx";
import { palette } from "../../test/palette.js";
import { assemble, generateSkinCss } from "../../test/skin.js";
import { passport as flowPassport } from "../flow/flow.anatomy.js";
import { anatomy, parts, passport } from "./grid.anatomy.js";
import { Grid, GridCell } from "./grid.jsx";
import { form } from "./grid.recipe.js";

afterEach(cleanup);

/** Читатель, знающий обе раскладки: ими и различаются координаты. */
const lookup: PassportLookup = (component) =>
  component === passport.component
    ? passport
    : component === flowPassport.component
      ? flowPassport
      : undefined;

const attributesOf = (node: Element) => [...node.attributes].map((a) => a.name).sort();

const узлы = (host: ParentNode, part: keyof typeof parts) => [
  ...host.querySelectorAll(`[data-part="${parts[part].attrs["data-part"]}"]`),
];

describe("Grid", () => {
  it("рендерит ОДИН узел и ничего вокруг", () => {
    const host = mount(() => <Grid>ячейки</Grid>);

    expect(host.children.length).toBe(1);
    expect(узлы(host, "root").length).toBe(1);
  });

  it("в разметке НЕТ ни числа колонок, ни зазора", () => {
    const host = mount(() => (
      <Grid>
        <GridCell>поле</GridCell>
      </Grid>
    ));

    expect(attributesOf(узлы(host, "root")[0])).toEqual(["data-part", "data-scope"]);
    expect(attributesOf(узлы(host, "cell")[0])).toEqual(["data-part", "data-scope"]);
  });

  it("тег выбирает потребитель, адрес остаётся на месте", () => {
    const host = mount(() => <Grid as="ul">пункты</Grid>);

    expect(one(host, "ul").getAttribute("data-part")).toBe("root");
  });
});

describe("паспорт сетки", () => {
  it("каждая часть анатомии появляется в документе — её же атрибутами", () => {
    const host = mount(() => (
      <Grid>
        <GridCell>поле</GridCell>
      </Grid>
    ));

    for (const part of anatomy.keys()) {
      expect(узлы(host, part).length).toBeGreaterThan(0);
      expect(узлы(host, part)[0].getAttribute("data-scope")).toBe(passport.component);
    }
  });

  it("объявленная вложенность совпадает с живой разметкой", () => {
    const host = mount(() => (
      <Grid>
        <GridCell>поле</GridCell>
      </Grid>
    ));

    const объявлено = (partOf(passport, "root")?.accepts ?? []).some(
      (a) => a.kind === "part" && a.name === "cell",
    );

    expect(объявлено).toBe(true);
    expect(узлы(host, "root")[0].querySelector('[data-part="cell"]')).not.toBeNull();
  });

  it("ячейка сетки и элемент потока — РАЗНЫЕ координаты", () => {
    // Ради этого сетка и заведена отдельным компонентом. Будь раскладка одна, обе координаты
    // совпали бы, а различала бы их вариация предка — поля, которого в адресе нет.
    const host = mount(() => (
      <Grid>
        <GridCell>поле</GridCell>
      </Grid>
    ));

    const ячейка = coordinateOf(узлы(host, "cell")[0], lookup);

    expect(ячейка?.component).toBe("grid");
    expect(ячейка?.part).toBe("cell");
    expect(ячейка?.ancestor).toEqual({ component: "grid", part: "root", states: [] });
    expect(ячейка?.component).not.toBe(flowPassport.component);
  });

  it("состояний нет ни у одной части, группа и род объявлены", () => {
    for (const part of passport.parts) expect(part.states).toEqual([]);

    expect(passport.group).toBe("layout");
    expect(passport.genus).toBe("component");
  });
});

// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`, `grid.recipe.ts`): компонент доказывает себя сам — паспорт
// сетки МОЖНО одеть настоящей механикой скина целиком.
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
