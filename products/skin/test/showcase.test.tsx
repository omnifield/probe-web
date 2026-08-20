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

import { knownComponents, sketchOf } from "@omnifield/probe-web-assembly";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "../src/showcase/app.jsx";
import { BUTTON_CASES, CASES } from "../src/showcase/cases.js";
import { REGISTRY } from "../src/showcase/registry.js";
import { cleanup, mount } from "./dom.jsx";

afterEach(cleanup);

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

describe("случаи", () => {
  it("дерево случая — образец компонента, а не своя разметка", () => {
    const sketch = sketchOf(REGISTRY, "button");

    expect(sketch).toBeDefined();

    for (const item of BUTTON_CASES) {
      expect(item.tree.components.root).toBe(sketch?.components.root);
      expect(Object.keys(item.tree.components.nodes)).toEqual(
        Object.keys(sketch?.components.nodes ?? {}),
      );
    }
  });

  it("узлы случая адресуют только объявленные части", () => {
    const passport = passportOf("button");
    const declared = new Set(passport?.anatomy.keys() ?? []);

    for (const item of BUTTON_CASES) {
      for (const node of Object.values(item.tree.components.nodes)) {
        const part = node.type === "button" ? passport?.root : node.type.split(".").at(-1);
        expect(declared.has(part ?? "")).toBe(true);
      }
    }
  });

  it("каждый случай назван и объяснён — случай без повода не показывают", () => {
    for (const item of BUTTON_CASES) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.note.length).toBeGreaterThan(0);
    }
  });

  it("первый случай — базовый", () => {
    expect(BUTTON_CASES[0]?.id).toBe("base");
  });

  it("случаи есть у каждого компонента перечня", () => {
    for (const component of knownComponents(REGISTRY)) {
      expect(CASES[component]?.length ?? 0).toBeGreaterThan(0);
    }
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

  it("части и состояния на странице — из паспорта, а не из своего перечня", () => {
    const host = mount(() => <App />);
    const passport = passportOf("button");
    const shown = host.textContent ?? "";

    for (const part of passport?.parts ?? []) {
      expect(shown).toContain(part.name);
      for (const state of part.states) expect(shown).toContain(state.name);
    }
  });
});
