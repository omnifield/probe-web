// КАСКАД: правка образца обязана перебивать скин, а по весу селектора выходит наоборот.
//
// Координата даёт две единицы веса (`[data-scope][data-part]`), имя узла — одну. Не реши мы это
// в самом порождении, первый же случай показал бы «правка не применилась», и чинить пошли бы вид.
//
// ## Почему проба выглядит так
//
// jsdom каскадные слои НЕ понимает: правила внутри `@layer` он молча игнорирует целиком
// (проверено — вычисленный стиль остаётся пустым). Поэтому текст прогоняется через
// `@csstools/postcss-cascade-layers` — стандартный полифил, который переписывает слои в вес
// селектора. Это ПРОВЕРКА, а не поставка: полифил стоит в devDependencies, в порождённый файл он
// не попадает и потребителю не едет.
//
// Проба честно показывает и обратное: тот же текст БЕЗ слоёв даёт противоположный ответ. Значит
// проверяется именно механизм, а не совпадение.

import layers from "@csstools/postcss-cascade-layers";
import { JSDOM } from "jsdom";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { flattenCss } from "../src/flatten.js";
import { withPassports } from "../src/generate.js";
import { NODE_ATTRIBUTE } from "../src/marks.js";
import type { SketchEdit } from "../src/model.js";
import { lookup } from "./passports.js";
import { buttonSkin } from "./skins.js";

// Источник паспортов называется ОДИН раз (`PWEB-94`): дальше он приезжает связкой.
const { generateSketchCss, generateSkinCss } = withPassports(lookup);

/** Цвет, который ставит скин базой, и цвет, которым его перебивает правка образца. */
const SKIN_COLOUR = "rgb(1, 2, 3)";
const SKETCH_COLOUR = "rgb(9, 9, 9)";

// Генератор отдаёт ВЛОЖЕННУЮ форму — браузеру она годится как есть, а jsdom её не понимает так
// же, как не понимает слои. Поэтому проба разворачивает и то и другое: обе вещи — ограничение
// окружения пробы, а не поставки.
const skinCss = flattenCss(generateSkinCss(buttonSkin));

const edits: readonly SketchEdit[] = [
  {
    node: "btn-1",
    component: "button",
    part: "root",
    style: { props: { backgroundColor: SKETCH_COLOUR } },
  },
];
const sketchCss = flattenCss(generateSketchCss(edits));

/** Слои — в вес селектора, как это делает браузер, только заранее. */
function withLayers(css: string): string {
  return postcss([layers()]).process(css, { from: undefined }).css;
}

/** Тот же текст, но слои просто СНЯТЫ — как если бы механизма не было вовсе. */
function withoutLayers(css: string): string {
  const root = postcss.parse(css);

  root.walkAtRules("layer", (at) => {
    if (at.nodes) at.replaceWith(at.nodes);
    else at.remove();
  });

  return root.toString();
}

/** Вычисленный фон живого узла под данным CSS. Порядок листов — скин, затем правка. */
function background(css: string): string {
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head><body>` +
      `<button data-scope="button" data-part="root" ${NODE_ATTRIBUTE}="btn-1"></button>` +
      "</body></html>",
  );
  const button = dom.window.document.querySelector("button")!;

  return dom.window.getComputedStyle(button).backgroundColor;
}

describe("правка образца перебивает скин", () => {
  it("со слоями — побеждает правка, хотя её селектор легче", () => {
    expect(background(withLayers(`${skinCss}\n${sketchCss}`))).toBe(SKETCH_COLOUR);
  });

  it("без слоёв — побеждает скин: механизм действительно нужен, а не описан", () => {
    expect(background(withoutLayers(`${skinCss}\n${sketchCss}`))).toBe(SKIN_COLOUR);
  });

  it("порядок подключения ничего не решает: слой объявлен в обоих текстах", () => {
    expect(background(withLayers(`${sketchCss}\n${skinCss}`))).toBe(SKETCH_COLOUR);
  });

  it("один скин без правок работает сам по себе", () => {
    expect(background(withLayers(skinCss))).toBe(SKIN_COLOUR);
  });
});

describe("вариация с вложенной части не перебивает её же состояние (`PWEB-103`)", () => {
  // Вариация вложенной части адресуется через КОРЕНЬ — иначе правило мёртвое (`SKINED-5`, п. 2).
  // Условие при этом ставит МЕХАНИКА, а не автор: он написал «ввод при вариации X», предка он не
  // писал. Значит и вес его правила от нашего решения меняться не вправе — порядком здесь
  // распоряжается порождение, а не длина селектора.
  //
  // Проба живая, а не про текст: считается ВЫЧИСЛЕННЫЙ цвет, то есть тот же вопрос, который
  // задаёт браузер.

  const VARIANT_COLOUR = "rgb(10, 20, 30)";
  const STATE_COLOUR = "rgb(40, 50, 60)";

  /** Скин пробного поля: вид ввода при вариации корня и вид того же ввода в состоянии. */
  const поле = flattenCss(
    generateSkinCss({
      name: "п",
      recipes: {
        field: {
          base: {
            control: { states: { focus: { props: { backgroundColor: STATE_COLOUR } } } },
          },
          variants: { крупное: { control: { props: { backgroundColor: VARIANT_COLOUR } } } },
          defaultVariant: "крупное",
        },
      },
    }),
  );

  /** Вычисленный фон ввода, лежащего внутри корня с этой вариацией и в этом состоянии. */
  function фон(состояние: string): string {
    const dom = new JSDOM(
      `<!doctype html><html><head><style>${withLayers(поле)}</style></head><body>` +
        '<div data-scope="field" data-part="root" data-variant="крупное">' +
        `<div data-scope="field" data-part="control" ${состояние}></div>` +
        "</div></body></html>",
    );

    return dom.window.getComputedStyle(dom.window.document.querySelector("[data-part=control]")!)
      .backgroundColor;
  }

  it("правило вариации ДОЕЗЖАЕТ до вложенной части — на ней атрибута нет", () => {
    // Первый конец: до правки это правило было мёртвым, и краснеет здесь именно оно.
    expect(фон("")).toBe(VARIANT_COLOUR);
  });

  it("а состояние той же части по-прежнему его перебивает", () => {
    // Второй конец, и он про вес. Считай мы предка обычным доводом — правило вариации весило бы
    // пять доводов против трёх у состояния, и человек получил бы вид, которого не писал.
    expect(фон("data-focus")).toBe(STATE_COLOUR);
  });
});

describe("вес селектора действительно против нас", () => {
  it("у координаты два атрибута, у имени узла один — отсюда и вся возня со слоями", () => {
    const coordinate = '[data-scope="button"][data-part="root"]';
    const node = `[${NODE_ATTRIBUTE}="btn-1"]`;

    expect(coordinate.match(/\[/g)).toHaveLength(2);
    expect(node.match(/\[/g)).toHaveLength(1);
  });
});
