// СКВОЗНОЙ ПРОХОД — гейт фреймворка. Складываются ли средства между собой.
//
//   паспорт → образец → дерево → правки → рецепт → CSS → надет → снят
//
// Каждое звено проверено у себя, и здесь оно не перепроверяется. Предмет — ШОВ: доезжает ли то,
// что отдало одно средство, до того, что принимает следующее, и остаётся ли на стыке смысл.
//
// ## Материал свой, и он не продукт
//
// Скин-фикстура ниже написана ДЛЯ ЭТОЙ ПРОБЫ. Её задача — доказать, что средства работают, а не
// показать красивый вид: минимальная, на семенах, покрывающая кнопку целиком.
//
// Через продукт такой гейт ставить нельзя, и прежняя редакция задачи это делала. Наша готовность
// не может зависеть от чужих сроков, а чужой дефект не должен выглядеть как наш: продукт не готов
// — это не говорит ничего о том, работают ли средства.
//
// Отсюда же запрет наоборот: **фикстуру не превращать в продукт.** «Раз уж написали, пусть будет
// скином» — чужой предмет, и он живёт в `products/skin`.
//
// ## Чем окружение пробы отличается от браузера
//
// jsdom не понимает ни каскадных слоёв, ни вложенности CSS. Обе вещи разворачиваются перед
// подачей: слои — стандартным полифилом, вложенность — нашим же `flattenCss`. Разворот идёт
// ВНУТРИ источника скинов, то есть механика надевания работает настоящая, своим листом и своим
// признаком на корне. Названо тут, чтобы не выглядело обходом.

import layers from "@csstools/postcss-cascade-layers";
import {
  createRegistry,
  insertNode,
  nodesSharingCoordinate,
  RenderTree,
  sketchOf,
  type AssemblyTree,
  type ReadablePassport,
} from "@omnifield/probe-web-assembly";
import { makeSkinSwitch, type SkinSource } from "@omnifield/probe-web-runtime";
import { Button, Surface } from "@omnifield/probe-web-ui";
import { admits, coordinateOf, passportOf, PASSPORTS } from "@omnifield/probe-web-ui/passport";
import postcss from "postcss";
import { afterEach, describe, expect, it } from "vitest";

import { skinContrast } from "../src/contrast.js";
import { flattenCss } from "../src/flatten.js";
import { generateSkinCss } from "../src/generate.js";
import type { Skin } from "../src/model.js";
import { skinGaps } from "../src/coverage.js";
import { cleanup, mount } from "./dom.jsx";

// ── МАТЕРИАЛ ─────────────────────────────────────────────────────────────────────────────────

/**
 * Скин прохода: две шкалы семенами, кнопка одета целиком.
 *
 * Целиком — значит все семь объявленных состояний плюс вариации с умолчанием. Проверяется это не
 * глазами, а механикой покрытия: непокрытого по кнопке остаться не должно.
 *
 * Рамка в фикстуре ЕСТЬ, и она тут не для красоты. На ней проход показывает разведение вопросов
 * (`PWEB-47`): норму рамке счёт больше не приписывает — она граничит с тем, что снаружи узла, а
 * снаружи механике неизвестно, — но и молчать про эту половину не молчит. Проход проверяет обе
 * стороны: изъянов нет, а непокрытое объявлено.
 *
 * Прежде эта же рамка называлась нарушением порога 3 (1,68 при заливке соседней ступенью). Это и
 * была находка прохода — гейт нашёл не дефект скина, а дефект собственной проверки.
 */
const passageSkin: Skin = {
  name: "проход",
  variables: {
    scales: { знак: "oklch(0.55 0.21 27)", фон: "oklch(0.62 0.004 285)" },
  },
  recipes: {
    button: {
      base: {
        root: {
          props: {
            display: "inline-flex",
            alignItems: "center",
            paddingInline: "0.75rem",
            borderRadius: "0.375rem",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--знак-8)",
            color: "var(--знак-contrast)",
            backgroundColor: "var(--знак-9)",
          },
          states: {
            hover: { props: { backgroundColor: "var(--знак-10)" } },
            active: { props: { backgroundColor: "var(--знак-10)" } },
            "focus-visible": { props: { outlineWidth: "2px", outlineStyle: "solid" } },
            disabled: { props: { color: "var(--фон-11)", backgroundColor: "var(--фон-3)" } },
            busy: { props: { cursor: "progress" } },
            expanded: { props: { backgroundColor: "var(--знак-10)" } },
            pressed: { props: { backgroundColor: "var(--знак-10)" } },
          },
        },
      },
      variants: {
        главная: { root: { props: { backgroundColor: "var(--знак-9)" } } },
        тихая: { root: { props: { color: "var(--знак-11)", backgroundColor: "var(--знак-1)" } } },
      },
      defaultVariant: "главная",
    },
  },
};

// ── ОБВЯЗКА ──────────────────────────────────────────────────────────────────────────────────

const registry = createRegistry({
  components: { button: Button, surface: Surface },
  passports: {
    button: passportOf("button") as ReadablePassport,
    surface: passportOf("surface") as ReadablePassport,
  },
  admits,
});

/** Текст скина, годный для jsdom: развёрнутая вложенность и развёрнутые слои. */
function wearable(skin: Skin): string {
  return postcss([layers()]).process(flattenCss(generateSkinCss(skin, passportOf)), {
    from: undefined,
  }).css;
}

/** Источник скинов приложения — та же форма, которую механика надевания ждёт от продукта. */
const source: SkinSource = {
  names: () => [passageSkin.name],
  css: () => wearable(passageSkin),
};

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-skin");
});

// ── ЗВЕНЬЯ ───────────────────────────────────────────────────────────────────────────────────

describe("паспорт → образец", () => {
  it("образец компонента строится из анатомии, а не из представления о нём", () => {
    const sketch = sketchOf(registry, "surface")!;

    expect(sketch).toBeDefined();
    // У поверхности одна часть, и образец — ровно она. Ни одного узла «от себя»: содержимое
    // потребителя род допускает, но не требует.
    expect(Object.keys(sketch.components.nodes)).toEqual(["surface"]);
    expect(sketch.components.root).toBe("surface");
  });
});

describe("образец → дерево → правки", () => {
  const sketch = sketchOf(registry, "surface")!;

  it("дерево принимает допустимую правку", () => {
    const put = insertNode(sketch, registry, { id: "первая", type: "button" }, "surface");

    expect(put.ok).toBe(true);
    if (!put.ok) return;
    expect(Object.keys(put.tree.components.nodes)).toContain("первая");
  });

  it("и отвергает недопустимое вложение — ИМЕНЕМ, а не молчанием", () => {
    const first = insertNode(sketch, registry, { id: "первая", type: "button" }, "surface");
    if (!first.ok) throw new Error("допустимая правка не прошла");

    // Кнопка пускает внутрь текст и значок, но не компонент: класть в неё поверхность нельзя.
    const bad = insertNode(first.tree, registry, { id: "внутрь", type: "surface" }, "первая");

    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.refusal).toBe("content-not-admitted");
    expect(bad.means.length).toBeGreaterThan(0);
  });
});

/**
 * Дерево прохода: поверхность и две кнопки — одна голая, одна с вариацией.
 *
 * Пропы кладутся ПРАВКОЙ, а не дописыванием в готовое дерево: узел дерева неизменяем, и это его
 * свойство, а не неудобство — правка возвращает новое дерево, а не портит старое.
 *
 * @param props что положить первой кнопке
 */
function passageTree(props: Readonly<Record<string, unknown>> = {}): AssemblyTree {
  const sketch = sketchOf(registry, "surface")!;
  const first = insertNode(sketch, registry, { id: "сохранить", type: "button", props }, "surface");
  if (!first.ok) throw new Error(first.refusal);

  const second = insertNode(
    first.tree,
    registry,
    { id: "отменить", type: "button", props: { "data-variant": "тихая" } },
    "surface",
  );
  if (!second.ok) throw new Error(second.refusal);

  return second.tree;
}

describe("дерево → живая разметка → координата", () => {
  it("координата узла выводится из ЖИВОЙ разметки, а не из записи дерева", () => {
    const host = mount(() => <RenderedTree />);
    const node = host.querySelector("button")!;

    const coordinate = coordinateOf(node, passportOf);

    expect(coordinate).toBeDefined();
    expect(coordinate).toMatchObject({ component: "button", part: "root" });
  });

  it("вариация, поставленная деревом, доезжает до координаты", () => {
    const host = mount(() => <RenderedTree />);
    const quiet = host.querySelector('[data-variant="тихая"]')!;

    expect(coordinateOf(quiet, passportOf)?.variant).toBe("тихая");
  });

  it("узлы одной координаты перечислимы механикой сборки", () => {
    const kin = nodesSharingCoordinate(passageTree(), registry, "сохранить");

    expect(kin).toEqual(["отменить"]);
  });
});

describe("рецепт → CSS", () => {
  const css = generateSkinCss(passageSkin, passportOf);

  it("кнопка одета ЦЕЛИКОМ — непокрытого по ней не осталось", () => {
    expect(skinGaps(passageSkin, [PASSPORTS.button!])).toEqual([]);
  });

  it("рецепт превратился в правила, адресующие координаты из анатомии", () => {
    const attrs = PASSPORTS.button!.anatomy.build().root.attrs;
    const coordinate = Object.entries(attrs)
      .map(([name, value]) => `[${name}="${value}"]`)
      .join("");

    const selectors: string[] = [];
    postcss.parse(css).walkRules((rule) => {
      if (!rule.selector.startsWith(":root")) selectors.push(rule.selector);
    });

    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) expect(selector).toContain(coordinate);
  });

  it("значения пришли из семян: обе половины в файле", () => {
    expect(css).toContain("--знак-9:");
    expect(css).toContain(":root.dark");
  });

  it("читаемость на своём материале молчит — изъянов нет", () => {
    expect(skinContrast(passageSkin, [PASSPORTS.button!]).notes).toEqual([]);
  });

  it("и честно говорит, чего не смотрит: внешний контраст рамки", () => {
    // Вторая половина того же ответа. Молчаливое частичное покрытие хуже объявленного
    // непокрытия: по нему решают, что проверено всё.
    const { unchecked } = skinContrast(passageSkin, [PASSPORTS.button!]);

    expect(unchecked).toHaveLength(1);
    expect(unchecked[0]!.properties).toEqual(["border-color"]);
  });

  it("и молчит не оттого, что считать нечем: испорченный материал она называет", () => {
    // Гейт, который не умеет краснеть, ничего не гейтит. Подменяем текст ступенью, которая
    // против девятой не читается, — и проверка обязана это увидеть.
    const spoiled: Skin = {
      ...passageSkin,
      recipes: {
        button: {
          ...passageSkin.recipes.button!,
          base: { root: { props: { color: "var(--знак-8)", backgroundColor: "var(--знак-9)" } } },
        },
      },
    };

    expect(skinContrast(spoiled, [PASSPORTS.button!]).notes.length).toBeGreaterThan(0);
  });

  it("покрытие молчит не даром: снятое состояние всплывает", () => {
    const root = passageSkin.recipes.button!.base!.root!;
    const states = { ...root.states };
    delete (states as Record<string, unknown>)["pressed"];

    const thinner: Skin = {
      ...passageSkin,
      recipes: { button: { ...passageSkin.recipes.button!, base: { root: { ...root, states } } } },
    };

    expect(skinGaps(thinner, [PASSPORTS.button!]).map((gap) => gap.kind)).toEqual(["state"]);
  });
});

// ── ПРОХОД ЦЕЛИКОМ ───────────────────────────────────────────────────────────────────────────

/** Дерево прохода, отрисованное механикой сборки. */
function RenderedTree() {
  return <RenderTree tree={passageTree()} registry={registry} />;
}

/** Заливка узла, как её видит документ. */
function fill(node: Element): string {
  return getComputedStyle(node).backgroundColor;
}

/** Заливка ГОЛОГО узла — та, что приходит от браузера, а не от нас. */
const BARE = "rgba(0, 0, 0, 0)";

describe("надет → снят: проход целиком и повторяемо", () => {
  it("без скина приложение поднимается и пригодно к работе", () => {
    let clicked = 0;
    const tree = passageTree({ onClick: () => (clicked += 1) });

    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const node = host.querySelector("button")!;

    expect(fill(node)).toBe(BARE);
    node.click();
    expect(clicked).toBe(1);
  });

  it("проход: голо → одето → снято → снова голо", async () => {
    const host = mount(() => <RenderedTree />);
    const [first, second] = [...host.querySelectorAll("button")];
    const skin = makeSkinSwitch(source);

    expect(fill(first!)).toBe(BARE);

    await skin.wear(passageSkin.name, { remember: false });

    expect(skin.worn()).toBe(passageSkin.name);
    expect(fill(first!)).not.toBe(BARE);
    expect(getComputedStyle(first!).display).toBe("inline-flex");

    skin.takeOff({ remember: false });

    expect(skin.worn()).toBeNull();
    expect(fill(first!)).toBe(BARE);
    // Дерево при этом живо: снятие скина ничего не ломает.
    expect(first!.isConnected).toBe(true);
    expect(second!.isConnected).toBe(true);

    skin.dispose();
  });

  it("проход повторяем: второй заход даёт то же самое", async () => {
    const host = mount(() => <RenderedTree />);
    const node = host.querySelector("button")!;
    const skin = makeSkinSwitch(source);

    await skin.wear(passageSkin.name, { remember: false });
    const dressed = fill(node);
    skin.takeOff({ remember: false });
    await skin.wear(passageSkin.name, { remember: false });

    expect(fill(node)).toBe(dressed);

    skin.takeOff({ remember: false });
    skin.dispose();
  });

  it("узлы одной координаты одеваются ВМЕСТЕ, одним правилом", async () => {
    const host = mount(() => <RenderedTree />);
    const [first, second] = [...host.querySelectorAll("button")];
    const skin = makeSkinSwitch(source);

    await skin.wear(passageSkin.name, { remember: false });

    // Обе кнопки получили базу: она адресована координатой, а не узлом.
    expect(getComputedStyle(first!).display).toBe("inline-flex");
    expect(getComputedStyle(second!).display).toBe("inline-flex");
    // Одеты ОБЕ — иначе «разные заливки» прошло бы и на одной одетой.
    expect(fill(first!)).not.toBe(BARE);
    expect(fill(second!)).not.toBe(BARE);
    // А заливки разные — вторая несёт вариацию, и это тоже координата, а не место.
    expect(fill(first!)).not.toBe(fill(second!));

    skin.takeOff({ remember: false });
    skin.dispose();
  });
});
