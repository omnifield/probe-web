// ВИТРИНА: перечень из реестра, случаи из образца, отрисовка механикой (`PWEB-31`).
//
// Проверяется не то, что «страница нарисовалась», а три обещания, на которых витрина стоит:
//
//   1. перечень компонентов приходит ИЗ РЕЕСТРА, своего списка нет;
//   2. дерево случая — ОБРАЗЕЦ компонента, а не свёрстанная вручную разметка;
//   3. нарисованный узел несёт АДРЕСНЫЕ АТРИБУТЫ из анатомии — то, за что цепляется скин.
//
// Третье — самое важное: пока адрес на узле есть, скин может одеть компонент, даже если самого
// скина ещё нет. Пропади адрес — витрина продолжит выглядеть исправной, а одеть станет нечего.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { isContent, knownComponents, sketchOf } from "@omnifield/probe-web-assembly";
import { KIT } from "@omnifield/probe-web-ui";
import {
  type ComponentPassport,
  GROUPS,
  groupOf,
  passportOf,
} from "@omnifield/probe-web-ui/passport";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/showcase/app.jsx";
import { ANY, casesOf, rootPartOf, type ShowcaseCase } from "../src/showcase/cases.js";
import { REGISTRY } from "../src/showcase/registry.js";

import { cleanup, mount } from "./dom.jsx";
import { FORM, OUTFIT, PALETTE } from "./fixtures.js";
import { restoreStore, serveLook } from "./store-stub.js";

beforeEach(() => serveLook({ palettes: [PALETTE], forms: [FORM], outfits: [OUTFIT] }));

afterEach(() => {
  restoreStore();
  cleanup();
  document.documentElement.removeAttribute("data-skin");
  for (const sheet of document.querySelectorAll("style")) sheet.remove();
  localStorage.clear();
});

describe("перечень", () => {
  it("приходит из реестра", () => {
    // Перечень — тот, что отдаёт кит, а не тот, что успели вписать мы: компонент нового выпуска
    // появляется в пульте сам, вместе со своим долгом одевания.
    expect(knownComponents(REGISTRY)).toEqual(Object.keys(KIT).sort());
  });

  it("у каждого компонента перечня есть паспорт и карта частей — иначе одевать его нечем", () => {
    for (const component of knownComponents(REGISTRY)) {
      const пара = REGISTRY.components[component] as { passport?: unknown; parts?: unknown };

      expect(пара.passport).toBeDefined();
      expect(пара.parts).toBeDefined();
    }
  });
});

/** Выбирает компонент в перечне — перечень теперь весь кит, и первый в нём не кнопка. */
function pick(host: HTMLElement, component: string): void {
  const пункт = [...host.querySelectorAll<HTMLButtonElement>(".rail__item")].find(
    (кнопка) => (кнопка.textContent ?? "").trim() === component,
  );

  пункт?.click();
}

/** Имена вариаций пробной формы — оси взять больше неоткуда, их объявляет скин. */
const VARIANTS = Object.keys(FORM.recipe.variants ?? {});

/** Поток случаев кнопки при ОБЕИХ развёрнутых осях: вариации × состояния. */
const stream = (): ShowcaseCase[] =>
  casesOf("button", { part: rootPartOf("button"), variant: ANY, state: ANY, variants: VARIANTS });

/** Стартовый срез витрины: все вариации, состояние обычное. */
const plain = (): ShowcaseCase[] =>
  casesOf("button", { part: rootPartOf("button"), variant: ANY, state: null, variants: VARIANTS });

describe("случаи", () => {
  it("дерево случая — образец компонента, а не своя разметка", () => {
    const sketch = sketchOf(REGISTRY, "button");

    expect(sketch).toBeDefined();

    for (const item of stream()) {
      expect(item.tree.components.root).toBe(sketch?.components.root);

      // Узлы образца — все на месте и ни одного лишнего сверх ПОДПИСИ: её кладёт витрина как
      // потребитель, и кладёт узлом содержимого, а не своей разметкой.
      const свои = Object.keys(item.tree.components.nodes).filter(
        (id) => !id.startsWith("подпись-"),
      );

      expect(свои).toEqual(Object.keys(sketch?.components.nodes ?? {}));
    }
  });

  it("узлы случая адресуют только объявленные части", () => {
    const passport = passportOf("button");
    const declared = new Set(passport?.anatomy.keys() ?? []);

    for (const item of stream()) {
      for (const node of Object.values(item.tree.components.nodes)) {
        // Содержимое адреса не имеет: оно опознаётся родом, и спрашивать у него часть нечем.
        if (isContent(node)) continue;

        const part = node.type === "button" ? passport?.root : node.type.split(".").at(-1);
        expect(declared.has(part ?? "")).toBe(true);
      }
    }
  });

  it("случай назван ВАРИАЦИЕЙ, и ничем сверх неё", () => {
    for (const item of stream()) {
      expect(item.title).toBe(item.at.variant ?? "без вариации");

      // Ни части, ни паспортного объяснения: «кнопку держат нажатой» под карточкой с нажатой
      // кнопкой не сообщает ничего, чего не видно (решение user 2026-08-23).
      expect(item.title).not.toContain("·");
    }
  });

  it("стартовый срез — все вариации в обычном состоянии", () => {
    // Первым человек смотрит НА ВИД, а не на отклонения от него: наведённое и отключённое
    // читаются как «что происходит с этим видом», и показывать их вперемешку с ним значит
    // заставлять его выискивать.
    expect(plain()).toHaveLength(VARIANTS.length);
    expect(plain().map((item) => item.at.variant)).toEqual(VARIANTS);
    expect(plain().every((item) => item.at.state === null)).toBe(true);
  });

  it("обычное и «все» — разные положения оси, а не одно", () => {
    // Прежде они были склеены, и стартовый вид был произведением осей. Разница должна быть
    // видна машине, иначе она снова схлопнется.
    expect(stream().length).toBeGreaterThan(plain().length);
    expect(stream().some((item) => item.at.state !== null)).toBe(true);
    expect(plain().some((item) => item.at.state !== null)).toBe(false);
  });

  it("первая вариация — та, что скин объявил умолчанием", () => {
    // Отдельной строки «умолчание» нет: скин называет умолчание именем, и «атрибут не поставлен»
    // — тот же адрес. Две строки обещали бы два разных вида там, где вид один.
    const [первый] = stream();

    expect(первый?.title).toBe(Object.keys(FORM.recipe.variants ?? {})[0] ?? "");
    expect(первый?.at.state).toBeNull();
    expect(stream().some((item) => item.title.includes("умолчание"))).toBe(false);
  });

  it("случаи есть у каждого компонента перечня", () => {
    for (const component of knownComponents(REGISTRY)) {
      const slice = { part: rootPartOf(component), variant: ANY, state: null, variants: [] };

      expect(casesOf(component, slice).length).toBeGreaterThan(0);
    }
  });

  it("случаев мимо осей на витрине нет", () => {
    // Витрина показывает КООРДИНАТЫ. Случаи вроде «длинная подпись» и «в узком месте» —
    // не вариации и не состояния; в потоке вариаций они отвечают не на тот вопрос, с которым
    // сюда приходят, и уехали в раздел проверок редактора (решение user 2026-08-23).
    for (const item of stream()) {
      expect(item.title).toContain(item.at.variant);
    }

    const hover = casesOf("button", { part: "root", variant: ANY, state: "hover", variants: VARIANTS });

    expect(hover).toHaveLength(VARIANTS.length);
  });

  it("оси разворачиваются и фиксируются: срез меняет состав потока", () => {
    const all = stream();
    const one = casesOf("button", {
      part: "root",
      variant: VARIANTS[0] ?? ANY,
      state: "hover",
      variants: VARIANTS,
    });

    expect(all.length).toBeGreaterThan(one.length);
    // Обе оси названы — случай ровно один.
    expect(one).toHaveLength(1);
  });
});

describe("хедер", () => {
  it("список скинов — просто список, без ролей и групп", async () => {
    const host = mount(() => <App />);

    pick(host, "button");

    await vi.waitFor(() => {
      expect(host.querySelectorAll(".head__select option").length).toBeGreaterThan(1);
    });

    // Ролей у записей нет: человек берёт любой скин и делает из него свой.
    expect(host.querySelectorAll("optgroup")).toHaveLength(0);
  });

  it("скин выбирается списком, и «снят» — полноправный пункт", async () => {
    const host = mount(() => <App />);

    pick(host, "button");
    const select = await vi.waitFor(() => {
      const found = host.querySelector<HTMLSelectElement>(".head__select");
      expect(found?.options.length).toBeGreaterThan(1);
      return found as HTMLSelectElement;
    });

    // Первый пункт — снятие: голый кит это рабочее состояние продукта, а не отсутствие выбора.
    expect(select.options[0]?.value).toBe("");
    expect([...select.options].map((option) => option.value)).toContain(OUTFIT.name);
  });

  it("выбор списком надевает скин, пустой пункт — снимает", async () => {
    const host = mount(() => <App />);

    pick(host, "button");
    const select = await vi.waitFor(() => {
      const found = host.querySelector<HTMLSelectElement>(".head__select");
      expect(found?.options.length).toBeGreaterThan(1);
      return found as HTMLSelectElement;
    });

    select.value = OUTFIT.name;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() =>
      expect(document.documentElement.getAttribute("data-skin")).toBe(OUTFIT.name),
    );

    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() =>
      expect(document.documentElement.hasAttribute("data-skin")).toBe(false),
    );
  });

  it("режима без скина не предлагают — переключать нечего", async () => {
    serveLook({});

    const host = mount(() => <App />);

    pick(host, "button");

    await vi.waitFor(() => expect(host.textContent ?? "").toContain("Скинов в службе нет"));
    expect(host.querySelectorAll(".modes__item")).toHaveLength(0);
  });

  it("со скином половина меняется надеванием того же скина", async () => {
    const host = mount(() => <App />);

    pick(host, "button");

    const dark = await vi.waitFor(() => {
      const buttons = [...host.querySelectorAll<HTMLButtonElement>(".modes__item")];
      expect(buttons).toHaveLength(2);
      return buttons[1] as HTMLButtonElement;
    });

    dark.click();

    // Половина принадлежит скину, а не документу: второй ручки под неё нет, и тёмная половина
    // видна на корне ровно потому, что скин надет именно в ней.
    await vi.waitFor(() =>
      expect(document.documentElement.classList.contains("dark")).toBe(true),
    );
  });
});

/** Ставит ось состояний в названное положение — то же движение, что делает рукой человек. */
function chooseState(host: HTMLElement, value: string): void {
  // Осей на витрине две — вариация и состояние; части среди них больше нет.
  const [, stateAxis] = [...host.querySelectorAll<HTMLSelectElement>(".axes__select")];

  stateAxis!.value = value;
  stateAxis!.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("оси — фильтр, а не раскладка", () => {
  it("витрина открывается на обычном виде, а не на произведении осей", async () => {
    const host = mount(() => <App />);

    pick(host, "button");

    // Пришедший смотреть кнопки видит ВАРИАЦИИ — по одной карточке на каждую, — а не их
    // произведение на состояния, среди которого обычный вид пришлось бы выискивать.
    //
    // Ждём наряда: до его прихода вариаций нет вовсе, и поток состоит из человеческих случаев.
    await vi.waitFor(() => {
      // Обычный вид узнаётся по отсутствию подписи состояния: карточка называет вариацию, и
      // только её.
      const плоские = [...host.querySelectorAll(".case")].filter(
        (карточка) => карточка.querySelector(".case__state") === null,
      );

      expect(плоские).toHaveLength(Object.keys(FORM.recipe.variants ?? {}).length);
    });

    expect(host.querySelector("[data-force]")).toBeNull();
    expect(host.querySelector("[data-disabled]")).toBeNull();
  });

  it("выбор состояния сужает поток случаев", async () => {
    const host = mount(() => <App />);

    pick(host, "button");
    const before = await vi.waitFor(() => {
      const cards = host.querySelectorAll(".case");
      expect(cards.length).toBe(Object.keys(FORM.recipe.variants ?? {}).length);
      return cards.length;
    });

    chooseState(host, ANY);

    const развёрнуто = await vi.waitFor(() => {
      const cards = host.querySelectorAll(".case");
      expect(cards.length).toBeGreaterThan(before);
      return cards.length;
    });

    chooseState(host, "hover");

    await vi.waitFor(() => expect(host.querySelectorAll(".case").length).toBeLessThan(развёрнуто));
  });

  it("витрина не рисует внутри компонента ничего своего", async () => {
    const host = mount(() => <App />);

    pick(host, "button");

    await vi.waitFor(() => expect(host.querySelectorAll(".case").length).toBeGreaterThan(0));

    // Подсветка части отсюда убрана: она рисовала рамку ВНУТРИ каждой кнопки, и компонент
    // выглядел как кнопка на кнопке. Витрина показывает вид — своих отметок внутри быть не может.
    expect(host.querySelector(".pick")).toBeNull();
    for (const node of host.querySelectorAll('[data-scope="button"]')) {
      expect(node.querySelector("[aria-hidden]")).toBeNull();
    }
  });
});

describe("перечень по разделам", () => {
  it("раздел компонента приходит из его паспорта, а не из перечня витрины", () => {
    const host = mount(() => <App />);

    pick(host, "button");
    const passport = passportOf("button");
    const shown = host.textContent ?? "";

    expect(passport?.group).toBeDefined();
    expect(shown).toContain(GROUPS[groupOf(passport as ComponentPassport)]);
  });

  it("подписи разделов берутся у формы паспорта — своего словаря витрина не ведёт", () => {
    const source = readFileSync(resolve(process.cwd(), "src/showcase/app.tsx"), "utf8");

    expect(source).toContain("GROUPS");
    expect(source).not.toMatch(/["']Действия["']|["']Ввод["']|["']Всплывающее["']/);
  });
});

describe("отрисовка", () => {
  it("кнопка приходит с адресными атрибутами анатомии", () => {
    const host = mount(() => <App />);

    pick(host, "button");
    const node = host.querySelector('[data-scope="button"][data-part="root"]');

    expect(node).not.toBeNull();
    expect(node?.tagName.toLowerCase()).toBe("button");
  });

  it("узел адресуем механикой сборки — правке образца есть за что зацепиться", () => {
    const host = mount(() => <App />);

    pick(host, "button");

    expect(host.querySelector("[data-node]")).not.toBeNull();
  });

  it("состояние, которое ставит кит, доезжает до разметки", async () => {
    const host = mount(() => <App />);

    pick(host, "button");

    // Ось состояний стоит на ОБЫЧНОМ: показ начинается с вида, а не с отклонений от него.
    // Состояния надо развернуть — ровно так же, как это делает рукой человек.
    chooseState(host, ANY);

    // Случаи появляются после того, как приедет надетый наряд: вариации живут в нём.
    await vi.waitFor(() => expect(host.querySelector("[data-disabled]")).not.toBeNull());
  });

  it("псевдосостояние показано признаком — браузерное нам недоступно", async () => {
    const host = mount(() => <App />);

    pick(host, "button");

    chooseState(host, ANY);

    // Вариации приезжают из надетого наряда, поэтому случаи появляются не в первый кадр.
    await vi.waitFor(() => {
      const forced = [...host.querySelectorAll("[data-force]")].map((node) =>
        node.getAttribute("data-force"),
      );

      expect(forced).toEqual(expect.arrayContaining(["hover", "focus-visible", "active"]));
    });
  });

  it("имена вариаций приходят из записи НАДЕТОГО скина, а не из паспорта", async () => {
    const host = mount(() => <App />);

    pick(host, "button");

    // Ждём службу: перечень и запись приезжают запросами, и до их прихода вариаций нет
    // законно — называть нечего.
    await vi.waitFor(() => {
      const shown = host.textContent ?? "";
      for (const name of Object.keys(FORM.recipe.variants ?? {})) {
        expect(shown).toContain(name);
      }
    });

    // Обратная сторона того же: паспорт имён не знает и знать не должен.
    expect(JSON.stringify(passportOf("button"))).not.toContain("главная");
  });

  it("ось состояний перечисляет ПАСПОРТНЫЕ состояния — всех частей сразу", () => {
    const host = mount(() => <App />);

    pick(host, "button");

    const options = [...host.querySelectorAll(".axes__select option")].map(
      (option) => option.textContent ?? "",
    );

    // Части в осях НЕТ: смотрящий думает «наведение», а не «наведение корневой части». Сами
    // состояния при этом собраны по всем частям — у составного компонента они живут не на корне.
    for (const part of passportOf("button")?.parts ?? []) {
      expect(options).not.toContain(part.name);
      for (const state of part.states) expect(options).toContain(state.name);
    }
  });

  it("витрина показывает вид, а не техничку", () => {
    const host = mount(() => <App />);

    pick(host, "button");
    const shown = host.textContent ?? "";

    // Долг одевания, перечень частей с назначениями и паспортные факты уехали из витрины
    // (решение user 2026-08-21): смешение показа и технички портит оба.
    expect(shown).not.toContain("Долг одевания");
    expect(shown).not.toContain("поставщик:");
    expect(host.querySelector(".parts")).toBeNull();
    expect(host.querySelector(".gaps")).toBeNull();
  });

});
