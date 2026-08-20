// ШВЫ С ЧУЖИМИ ЗОНАМИ — два имени, которые механика скина адресует, но не объявляет.
//
// ## Что здесь чинится
//
// `data-node` объявляет и ставит механика сборки (`assembly`), класс тёмной пары — `runtime` со
// зоной значений. У нас они записаны вторыми копиями (`src/marks.ts`), потому что наружу ни одна
// из зон их не отдаёт: у `assembly` это литерал прямо в отрисовке, у `runtime` — внутренняя
// константа за замороженной поверхностью.
//
// Вторая копия опасна не тем, что она копия, а тем, КАК она ломается. Переименуют у хозяина —
// здесь останется прежнее, генератор напишет селектор, который ни во что не попадает, и отказа
// не будет: правило просто не сработает, а чинить пойдут ВИД.
//
// Эти пробы превращают тишину в красноту. Они не сверяют строки — они берут НАСТОЯЩИЙ вывод
// чужой зоны и спрашивают, попадает ли в него наш селектор. Переименование у хозяина роняет
// пробу в тот же прогон.
//
// **Это заплатка на время, а не решение.** Имя обязано приходить оттуда, где его ставят; один
// дом для обоих — cross-zone решение, поднято архитектору. Обе зоны стоят здесь
// `devDependency` — в поставку не едут.

import { createRegistry, RenderTree, type AssemblyTree, type ReadablePassport } from "@omnifield/probe-web-assembly";
import { applySkin } from "@omnifield/probe-web-runtime";
import { Button } from "@omnifield/probe-web-ui";
import { admits, passportOf } from "@omnifield/probe-web-ui/passport";
import postcss from "postcss";
import { afterEach, describe, expect, it } from "vitest";

import { generateSketchCss, generateSkinCss } from "../src/generate.js";
import { nodeSelector } from "../src/address.js";
import type { SketchEdit, Skin } from "../src/model.js";
import { lookup } from "./passports.js";
import { cleanup, mount } from "./dom.jsx";

afterEach(() => {
  cleanup();
  document.documentElement.className = "";
});

const registry = createRegistry({
  components: { button: Button },
  passports: { button: passportOf("button") as ReadablePassport },
  admits,
});

const tree: AssemblyTree = {
  components: {
    root: "btn-1",
    nodes: { "btn-1": { id: "btn-1", type: "button", parentId: null, children: [] } },
  },
};

/** Селекторы порождённого текста — как их видит парсер, а не поиск подстроки. */
function selectorsOf(css: string): string[] {
  const found: string[] = [];
  postcss.parse(css).walkRules((rule) => {
    found.push(rule.selector);
  });
  return found;
}

describe("шов с механикой сборки: признак узла", () => {
  const edits: readonly SketchEdit[] = [
    { node: "btn-1", component: "button", part: "root", style: { props: { color: "red" } } },
  ];

  it("наш селектор правки образца попадает в узел, который нарисовала ЧУЖАЯ механика", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const node = host.querySelector("button")!;

    // Не сверка строк: узел отрисован механикой сборки, признак поставила она, а спрашиваем мы
    // своим селектором. Переименует она признак — попадать станет некуда, и проба покраснеет.
    expect(node.matches(nodeSelector("btn-1"))).toBe(true);

    for (const selector of selectorsOf(generateSketchCss(edits, lookup))) {
      expect(node.matches(selector)).toBe(true);
    }
  });

  it("координата и признак узла живут на ОДНОМ узле — это две области одного адреса", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const node = host.querySelector("button")!;

    expect(node.matches('[data-scope="button"][data-part="root"]')).toBe(true);
    expect(node.matches(nodeSelector("btn-1"))).toBe(true);
  });
});

describe("шов с рантаймом: тёмная пара", () => {
  const skin: Skin = {
    name: "пара",
    variables: { light: { ink: "black" }, dark: { ink: "white" } },
    recipes: {},
  };

  /** Селектор тёмной половины — тот, что порождён, а не записанный в пробе. */
  const darkSelector = selectorsOf(generateSkinCss(skin, lookup)).find((selector) =>
    selector.startsWith(":root") && selector !== ":root",
  )!;

  it("порождённая тёмная половина цепляется за корень, который затемнил ЧУЖОЙ рантайм", () => {
    applySkin({ mode: "dark", remember: false });

    expect(document.documentElement.matches(darkSelector)).toBe(true);
  });

  it("в светлом режиме — не цепляется: светлая половина это ОТСУТСТВИЕ признака", () => {
    applySkin({ mode: "light", remember: false });

    expect(document.documentElement.matches(darkSelector)).toBe(false);
  });

  it("светлая половина цепляется за корень всегда — она не про режим", () => {
    applySkin({ mode: "light", remember: false });

    expect(document.documentElement.matches(":root")).toBe(true);
  });
});
