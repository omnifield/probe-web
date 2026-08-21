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

import { knownComponents, sketchOf } from "@omnifield/probe-web-assembly";
import { readSkin } from "@omnifield/probe-web-runtime";
import {
  type ComponentPassport,
  GROUPS,
  groupOf,
  passportOf,
} from "@omnifield/probe-web-ui/passport";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/showcase/app.jsx";
import { casesOf, rootPartOf, type ShowcaseCase } from "../src/showcase/cases.js";
import { REGISTRY } from "../src/showcase/registry.js";

import { cleanup, mount } from "./dom.jsx";
import { FIXTURE } from "./fixtures.js";
import { restoreStore, serveSkins } from "./store-stub.js";

beforeEach(() => serveSkins([FIXTURE]));

afterEach(() => {
  restoreStore();
  cleanup();
  document.documentElement.removeAttribute("data-skin");
  for (const sheet of document.querySelectorAll("style")) sheet.remove();
  localStorage.clear();
});

describe("перечень", () => {
  it("приходит из реестра", () => {
    expect(knownComponents(REGISTRY)).toEqual(["button"]);
  });

  it("у каждого компонента перечня есть паспорт — иначе одевать его нечем", () => {
    for (const component of knownComponents(REGISTRY)) {
      expect(REGISTRY.passports[component]).toBeDefined();
    }
  });
});

/** Поток случаев кнопки при развёрнутых осях — то, что видит человек по умолчанию. */
const stream = (): ShowcaseCase[] =>
  casesOf("button", { part: rootPartOf("button"), variants: Object.keys(FIXTURE.recipes.button?.variants ?? {}) });

describe("случаи", () => {
  it("дерево случая — образец компонента, а не своя разметка", () => {
    const sketch = sketchOf(REGISTRY, "button");

    expect(sketch).toBeDefined();

    for (const item of stream()) {
      expect(item.tree.components.root).toBe(sketch?.components.root);
      expect(Object.keys(item.tree.components.nodes)).toEqual(
        Object.keys(sketch?.components.nodes ?? {}),
      );
    }
  });

  it("узлы случая адресуют только объявленные части", () => {
    const passport = passportOf("button");
    const declared = new Set(passport?.anatomy.keys() ?? []);

    for (const item of stream()) {
      for (const node of Object.values(item.tree.components.nodes)) {
        const part = node.type === "button" ? passport?.root : node.type.split(".").at(-1);
        expect(declared.has(part ?? "")).toBe(true);
      }
    }
  });

  it("каждый случай назван и объяснён — случай без повода не показывают", () => {
    for (const item of stream()) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.note.length).toBeGreaterThan(0);
    }
  });

  it("первый случай — умолчание без состояния: с него начинается всё остальное", () => {
    expect(stream()[0]?.title).toContain("умолчание");
    expect(stream()[0]?.title).toContain("обычное");
  });

  it("случаи есть у каждого компонента перечня", () => {
    for (const component of knownComponents(REGISTRY)) {
      expect(casesOf(component, { part: rootPartOf(component), variants: [] }).length).toBeGreaterThan(0);
    }
  });

  it("фильтр отбирает и человеческие случаи — у них тоже есть координата", () => {
    const variants = Object.keys(FIXTURE.recipes.button?.variants ?? {});
    const hover = casesOf("button", { part: "root", state: "hover", variants });
    const disabled = casesOf("button", { part: "root", state: "disabled", variants });

    // «Занята» и «отключена по-настоящему» стоят в состояниях `busy` и `disabled`: в срезе по
    // наведению их быть не должно, иначе фильтр читается как неработающий.
    expect(hover.filter((item) => item.origin === "human")).toHaveLength(0);
    expect(disabled.filter((item) => item.origin === "human").map((item) => item.title)).toContain(
      "Отключена по-настоящему",
    );
  });

  it("оси разворачиваются и фиксируются: срез меняет состав потока", () => {
    const variants = Object.keys(FIXTURE.recipes.button?.variants ?? {});
    const all = casesOf("button", { part: "root", variants });
    const one = casesOf("button", { part: "root", variant: variants[0] ?? null, state: "hover", variants });

    expect(all.length).toBeGreaterThan(one.length);
    // Зафиксированный срез — ровно один осевой случай плюс человеческие.
    expect(one.filter((item) => item.origin === "axis")).toHaveLength(1);
  });
});

describe("хедер", () => {
  it("список скинов — просто список: ролей человек в нём не читает", async () => {
    const host = mount(() => <App />);

    await vi.waitFor(() => {
      expect(host.querySelectorAll(".head__select option").length).toBeGreaterThan(1);
    });

    // Защита от удаления живёт в хранилище, а не в подписях: человек берёт любой скин и делает
    // из него свой, и объяснять ему устройство записей в списке незачем.
    expect(host.querySelectorAll("optgroup")).toHaveLength(0);
    expect(host.textContent ?? "").not.toContain("эталон");
  });

  it("скин выбирается списком, и «снят» — полноправный пункт", async () => {
    const host = mount(() => <App />);
    const select = await vi.waitFor(() => {
      const found = host.querySelector<HTMLSelectElement>(".head__select");
      expect(found?.options.length).toBeGreaterThan(1);
      return found as HTMLSelectElement;
    });

    // Первый пункт — снятие: голый кит это рабочее состояние продукта, а не отсутствие выбора.
    expect(select.options[0]?.value).toBe("");
    expect([...select.options].map((option) => option.value)).toContain(FIXTURE.name);
  });

  it("выбор списком надевает скин, пустой пункт — снимает", async () => {
    const host = mount(() => <App />);
    const select = await vi.waitFor(() => {
      const found = host.querySelector<HTMLSelectElement>(".head__select");
      expect(found?.options.length).toBeGreaterThan(1);
      return found as HTMLSelectElement;
    });

    select.value = FIXTURE.name;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() =>
      expect(document.documentElement.getAttribute("data-skin")).toBe(FIXTURE.name),
    );

    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() =>
      expect(document.documentElement.hasAttribute("data-skin")).toBe(false),
    );
  });

  it("режим переключается механикой приложения", () => {
    const host = mount(() => <App />);
    const [light] = [...host.querySelectorAll<HTMLButtonElement>(".modes__item")];

    light?.click();

    expect(readSkin().mode).toBe("light");
  });
});

describe("оси — фильтр, а не раскладка", () => {
  it("выбор состояния сужает поток случаев", async () => {
    const host = mount(() => <App />);
    const before = await vi.waitFor(() => {
      const cards = host.querySelectorAll(".case");
      expect(cards.length).toBeGreaterThan(3);
      return cards.length;
    });

    const [, , stateAxis] = [...host.querySelectorAll<HTMLSelectElement>(".axes__select")];
    stateAxis!.value = "hover";
    stateAxis!.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() => expect(host.querySelectorAll(".case").length).toBeLessThan(before));
  });

  it("витрина не рисует внутри компонента ничего своего", async () => {
    const host = mount(() => <App />);

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
    const node = host.querySelector('[data-scope="button"][data-part="root"]');

    expect(node).not.toBeNull();
    expect(node?.tagName.toLowerCase()).toBe("button");
  });

  it("узел адресуем механикой сборки — правке образца есть за что зацепиться", () => {
    const host = mount(() => <App />);

    expect(host.querySelector("[data-node]")).not.toBeNull();
  });

  it("состояние, которое ставит кит, доезжает до разметки", () => {
    const host = mount(() => <App />);

    expect(host.querySelector("[data-disabled]")).not.toBeNull();
    expect(host.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("псевдосостояние показано признаком — браузерное нам недоступно", () => {
    const host = mount(() => <App />);
    const forced = [...host.querySelectorAll("[data-force]")].map((node) =>
      node.getAttribute("data-force"),
    );

    expect(forced).toEqual(expect.arrayContaining(["hover", "focus-visible", "active"]));
  });

  it("имена вариаций приходят из записи НАДЕТОГО скина, а не из паспорта", async () => {
    const host = mount(() => <App />);

    // Ждём службу: перечень и запись приезжают запросами, и до их прихода вариаций нет
    // законно — называть нечего.
    await vi.waitFor(() => {
      const shown = host.textContent ?? "";
      for (const name of Object.keys(FIXTURE.recipes.button?.variants ?? {})) {
        expect(shown).toContain(name);
      }
    });

    // Обратная сторона того же: паспорт имён не знает и знать не должен.
    expect(JSON.stringify(passportOf("button"))).not.toContain("главная");
  });

  it("оси перечисляют части и состояния ИЗ ПАСПОРТА, а не из своего словаря", () => {
    const host = mount(() => <App />);
    const passport = passportOf("button");
    const options = [...host.querySelectorAll(".axes__select option")].map(
      (option) => option.textContent ?? "",
    );

    for (const part of passport?.parts ?? []) {
      expect(options).toContain(part.name);
      for (const state of part.states) expect(options).toContain(state.name);
    }
  });

  it("витрина показывает вид, а не техничку", () => {
    const host = mount(() => <App />);
    const shown = host.textContent ?? "";

    // Долг одевания, перечень частей с назначениями и паспортные факты уехали из витрины
    // (решение user 2026-08-21): смешение показа и технички портит оба.
    expect(shown).not.toContain("Долг одевания");
    expect(shown).not.toContain("поставщик:");
    expect(host.querySelector(".parts")).toBeNull();
    expect(host.querySelector(".gaps")).toBeNull();
  });

  it("переход в редактор говорит правду: его ещё нет", async () => {
    const host = mount(() => <App />);
    const [, editor] = [...host.querySelectorAll<HTMLButtonElement>(".views__item")];

    editor?.click();

    await vi.waitFor(() => expect(host.textContent ?? "").toContain("Редактора ещё нет"));
    expect(host.querySelectorAll(".case")).toHaveLength(0);
  });
});
