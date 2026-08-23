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
} from "@omnifield/probe-web-assembly";
import { makeSkinSwitch, type SkinSource } from "@omnifield/probe-web-runtime";
import { kitOf } from "@omnifield/probe-web-ui";
import { admits, coordinateOf, passportOf, PASSPORTS } from "@omnifield/probe-web-ui/passport";
import postcss from "postcss";
import { afterEach, describe, expect, it } from "vitest";

import { skinContrast } from "../src/contrast.js";
import { flattenCss } from "../src/flatten.js";
import { withPassports } from "../src/generate.js";
import type { Skin } from "../src/model.js";
import { skinGaps } from "../src/coverage.js";
import { cleanup, mount } from "./dom.jsx";

// Источник паспортов называется ОДИН раз (`PWEB-94`): дальше он приезжает связкой.
const { generateSkinCss } = withPassports(passportOf);

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
  // ПАРА поставщика (`PWEB-85`): паспорт вместе с тем, чем рисуется каждая его часть. Составной
  // компонент от этого перестал быть особым случаем — часть достаётся тем же ходом, что корень,
  // и собирать карту частей у себя больше не надо. Ровно этого не хватало `PWEB-87`.
  components: {
    accordion: kitOf("accordion")!,
    button: kitOf("button")!,
    surface: kitOf("surface")!,
  },
  admits,
});

/** Текст скина, годный для jsdom: развёрнутая вложенность и развёрнутые слои. */
function wearable(skin: Skin): string {
  return postcss([layers()]).process(flattenCss(generateSkinCss(skin)), {
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

  // ── СОДЕРЖИМОЕ РЯДОМ С УЗЛАМИ-ДЕТЬМИ (`PWEB-87`) ───────────────────────────────────────
  //
  // Место, которого в проходе не было, а в устройстве появилось (`PWEB-83`). До него содержимое
  // ехало пропом, и отрисовка показывала его ТОЛЬКО у узла без детей: встал рядом любой узел —
  // подпись молча пропадала. Паспорт при этом обе вставки допускал, то есть дерево не выражало
  // того, что контракт разрешал.
  //
  // Подпись кладётся МЕЖДУ двумя кнопками — местом вставки, а не порядком вызовов. Порядок
  // содержимого относительно соседей был невыразим вовсе, и проверяется он именно так: не «текст
  // есть», а «текст стоит там, куда его положили».
  const подпись = insertNode(
    second.tree,
    registry,
    { id: "подпись", genus: "text", value: "рядом" },
    "surface",
    1,
  );
  if (!подпись.ok) throw new Error(подпись.refusal);

  // ── СОДЕРЖИМОЕ РЯДОМ С ЧАСТЬЮ СОСТАВНОГО КОМПОНЕНТА (`PWEB-88`) ────────────────────────
  //
  // Тот самый случай, на котором `PWEB-83` и был найден: кнопка раздела пускает внутрь и свою
  // часть-указатель, и текст. До пары поставщика (`PWEB-85`) собрать составной компонент в
  // пробе было нечем — карту частей пришлось бы писать самим, то есть закреплять догадку. Пара
  // это сняла: часть достаётся тем же ходом, что корень.
  let дерево = подпись.tree;
  const вложить = (узел: Parameters<typeof insertNode>[2], владелец: string): void => {
    const шаг = insertNode(дерево, registry, узел, владелец);
    if (!шаг.ok) throw new Error(`${шаг.refusal}: ${шаг.means}`);
    дерево = шаг.tree;
  };

  вложить({ id: "раскрывашка", type: "accordion" }, "surface");
  вложить({ id: "раздел", type: "accordion.item" }, "раскрывашка");
  вложить({ id: "заголовок", type: "accordion.itemTrigger" }, "раздел");
  // Подпись кладётся ПЕРВОЙ и остаётся первой после того, как рядом встала часть: именно это и
  // было невыразимо — не «текст есть», а «текст стоит там, куда его положили».
  вложить({ id: "название", genus: "text", value: "раздел" }, "заголовок");
  вложить({ id: "стрелка", type: "accordion.itemIndicator" }, "заголовок");

  return дерево;
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

describe("содержимое — УЗЕЛ РЯДОМ с соседями, а не проп", () => {
  // Прежде выживал ровно один из двух, и выживал молча: отрисовка показывала содержимое только
  // у узла без детей. Проход обязан идти ЧЕРЕЗ это место, иначе он покрывает вчерашнее
  // устройство.

  /** Корень поверхности в живой разметке — по координате из анатомии, а не по классу. */
  function поверхность(host: HTMLElement): HTMLElement {
    const адрес = PASSPORTS.surface!.anatomy.build().root.attrs;

    return host.querySelector(
      Object.entries(адрес)
        .map(([имя, значение]) => `[${имя}="${значение}"]`)
        .join(""),
    )!;
  }

  it("доехали ОБА рода: и подпись, и узлы-соседи", () => {
    // Главное здесь — И. Проверяется вместе, потому что порознь каждое проходило и до починки.
    const корень = поверхность(mount(() => <RenderedTree />));

    expect(корень.textContent).toContain("рядом");
    // Считаем ПРЯМЫХ детей и по координате кнопки: у раскрывашки внутри свой `button`, и поиск
    // по имени тега считал бы её тоже — проба перестала бы говорить про то, про что написана.
    expect(
      [...корень.children].filter((узел) => узел.matches('[data-scope="button"]')),
    ).toHaveLength(2);
  });

  it("ПОРЯДОК выразим: подпись стоит МЕЖДУ соседями, куда её и положили", () => {
    // Второе, независимое от первого: порядок содержимого относительно соседей был невыразим
    // вовсе. Смотрим живой порядок детей, а не запись дерева: записать можно что угодно,
    // показывает браузер.
    const дети = [...поверхность(mount(() => <RenderedTree />)).childNodes];
    const место = (кто: (узел: ChildNode) => boolean): number => дети.findIndex(кто);

    const первая = место((узел) => узел instanceof HTMLElement && узел.tagName === "BUTTON");
    const подпись = место((узел) => узел.textContent?.trim() === "рядом");
    const вторая = дети.findLastIndex(
      (узел) => узел instanceof HTMLElement && узел.tagName === "BUTTON",
    );

    expect(первая).toBeGreaterThanOrEqual(0);
    expect(подпись).toBeGreaterThan(первая);
    expect(подпись).toBeLessThan(вторая);
  });
});

describe("содержимое рядом с ЧАСТЬЮ составного компонента", () => {
  // Тот самый случай, на котором `PWEB-83` и был найден: паспорт кнопки раздела объявлял и
  // часть-указатель, и текст, а дерево выражало одно из двух — подпись молча отбрасывалась.
  //
  // В проход он вошёл только теперь: до пары поставщика (`PWEB-85`) собрать составной компонент
  // в пробе было нечем, и `PWEB-87` эту строку честно не добрал.

  /**
   * Селектор части раскрывашки — СОБРАННЫЙ ИЗ АНАТОМИИ, а не написанный.
   *
   * Написать его руками нельзя: в анатомии часть зовётся `itemIndicator`, а в разметку кит
   * подписывает её `item-indicator`. Проба, написавшая имя сама, ищет то, чего в документе нет,
   * и отвечает «не нашлось» вместо «не совпало» — оплачено здесь же, на первом прогоне.
   */
  function координата(part: "itemTrigger" | "itemIndicator"): string {
    return Object.entries(PASSPORTS.accordion!.anatomy.build()[part].attrs)
      .map(([имя, значение]) => `[${имя}="${значение}"]`)
      .join("");
  }

  /** Кнопка раздела в живой разметке — по координате из анатомии, а не по имени тега. */
  function заголовок(host: HTMLElement): HTMLElement {
    return host.querySelector(координата("itemTrigger"))!;
  }

  it("доехали ОБА: и подпись, и часть-указатель", () => {
    // Проверяется вместе, потому что порознь каждое проходило и до починки: выживал ровно один
    // из двух, и выживал молча.
    const кнопка = заголовок(mount(() => <RenderedTree />));

    expect(кнопка).toBeTruthy();
    expect(кнопка.textContent).toContain("раздел");
    expect(кнопка.querySelector(координата("itemIndicator"))).toBeTruthy();
  });

  it("ПОРЯДОК относительно части выразим: подпись стоит перед указателем", () => {
    const дети = [...заголовок(mount(() => <RenderedTree />)).childNodes];
    const подпись = дети.findIndex((узел) => узел.textContent?.trim() === "раздел");
    const указатель = дети.findIndex(
      (узел) => узел instanceof HTMLElement && узел.matches(координата("itemIndicator")),
    );

    expect(подпись).toBeGreaterThanOrEqual(0);
    expect(указатель).toBeGreaterThanOrEqual(0);
    expect(подпись).toBeLessThan(указатель);
  });
});

describe("рецепт → CSS", () => {
  const css = generateSkinCss(passageSkin);

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

    // Ответ надевания — во что одета страница целиком: имя И половина. Спрашиваем имя: предмет
    // прохода — «скин надет и виден», а половина у него своя проба, в шве с рантаймом.
    expect(skin.worn()?.name).toBe(passageSkin.name);
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
