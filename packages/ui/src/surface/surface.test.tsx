// Пробы поверхности — рядом с самим компонентом.
//
// Предмет здесь необычный для кита: у поверхности нет поведения, и проверять «что она делает»
// нечего. Проверяется ровно то, чем она является, — АДРЕС и его пустота: узел, на котором нет
// ничего, кроме адреса, и паспорт, который ничего сверх этого не обещает.
//
// Проба «голый узел несёт РОВНО адрес» здесь главная. Она ловит то, что иначе заводится тихо:
// «временный» отступ, дефолтный фон, класс-заглушку. Всё это вид, и приехать он обязан из скина.

import { afterEach, describe, expect, it } from "vitest";

import { coordinateOf, skinGaps, type Outfit, type PassportLookup } from "@omnifield/probe-web-skin/model";
import { cleanup, mount, one } from "../../test/dom.jsx";
import { palette } from "../../test/palette.js";
import { assemble, generateSkinCss } from "../../test/skin.js";
import { anatomy, parts, passport } from "./surface.anatomy.js";
import { Surface } from "./surface.jsx";
import { form } from "./surface.recipe.js";

afterEach(cleanup);

/** Читатель паспорта — им же будет пользоваться редактор. */
const lookup: PassportLookup = (component) =>
  component === passport.component ? passport : undefined;

/** Имена атрибутов на узле — перечнем, чтобы «лишнее» было видно поимённо. */
const attributesOf = (node: Element) => [...node.attributes].map((a) => a.name).sort();

describe("Surface", () => {
  it("рендерит ОДИН узел `<div>` и ничего вокруг", () => {
    const host = mount(() => <Surface>Итоги</Surface>);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("DIV");
    expect(host.textContent).toBe("Итоги");
  });

  it("голый узел несёт РОВНО адрес — ни класса, ни стиля, ни отступа", () => {
    // Главная проба компонента. Любое значение вида, поставленное китом «пока что», приедет
    // потребителю навсегда: снять его потом нельзя без мажора, а переодеть скином — вообще
    // никак, потому что своё правило кита сильнее отсутствующего.
    const host = mount(() => <Surface />);

    expect(attributesOf(one(host, "div"))).toEqual(["data-part", "data-scope"]);
  });

  it("тег выбирает потребитель, адрес остаётся на месте", () => {
    const host = mount(() => <Surface as="section">Итоги</Surface>);
    const node = one(host, "section");

    expect(node.getAttribute("data-scope")).toBe("surface");
    expect(node.getAttribute("data-part")).toBe("root");
  });

  it("имя вариации доезжает до узла — им скин и одевает плоскость", () => {
    const host = mount(() => <Surface data-variant="карточка">Итоги</Surface>);

    expect(one(host, "div").getAttribute(passport.variantAxis.mark.name)).toBe("карточка");
  });
});

describe("паспорт поверхности", () => {
  it("часть анатомии появляется в документе — её же атрибутами", () => {
    const host = mount(() => <Surface />);
    const node = one(host, "div");

    for (const part of anatomy.keys()) {
      for (const [name, value] of Object.entries(parts[part].attrs)) {
        expect(node.getAttribute(name)).toBe(value);
      }
    }
  });

  it("словарь состояний ПУСТ — и это утверждение, а не пробел", () => {
    // Обратная сторона у этого утверждения одна: на живом узле состояний тоже нет. Появись
    // здесь `data-`атрибут — паспорт молчал бы о наблюдаемом, и скин не смог бы его одеть.
    for (const part of passport.parts) expect(part.states).toEqual([]);
  });

  it("группа и род объявлены из закрытых перечней", () => {
    expect(passport.group).toBe("layout");
    expect(passport.genus).toBe("component");
  });

  it("узел превращается в координату — скину есть что адресовать", () => {
    const host = mount(() => <Surface data-variant="карточка" />);

    expect(coordinateOf(one(host, "div"), lookup)).toEqual({
      component: "surface",
      part: "root",
      states: [],
      variant: "карточка",
    });
  });
});

// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`, `surface.recipe.ts`): компонент доказывает себя сам —
// паспорт поверхности МОЖНО одеть настоящей механикой скина целиком.
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
